"""Settings service — unified LLM configuration with optional path override."""
import logging
import time
from sqlalchemy.orm import Session

from app.settings.models import UserSettings
from app.core.providers import PROVIDERS, resolve_provider, get_effective_base_url, get_effective_model
from app.core.exceptions import ValidationException

logger = logging.getLogger(__name__)


def _mask_api_key(key: str | None) -> str | None:
    """Mask an API key, showing only the last 4 characters."""
    if not key:
        return None
    if len(key) <= 4:
        return "****"
    return f"{key[:3]}...{key[-4:]}"


def get_settings(db: Session, user_id: str) -> dict:
    """Get the user's model configuration, creating a default row if needed."""
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "llm_provider": settings.llm_provider,
        "llm_api_key_masked": _mask_api_key(settings.llm_api_key),
        "llm_base_url": settings.llm_base_url,
        "llm_model": settings.llm_model,
        "use_path_llm_override": settings.use_path_llm_override,
        "path_llm_provider": settings.path_llm_provider,
        "path_llm_api_key_masked": _mask_api_key(settings.path_llm_api_key),
        "path_llm_base_url": settings.path_llm_base_url,
        "path_llm_model": settings.path_llm_model,
    }


def update_settings(
    db: Session, user_id: str, data: dict
) -> dict:
    """Update the user's model configuration."""
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)

    # ── Primary LLM config (shared by Agent + Path by default) ──
    if "llm_provider" in data and data["llm_provider"] is not None:
        provider_key = data["llm_provider"].strip().lower()
        if provider_key not in PROVIDERS:
            valid = ", ".join(PROVIDERS.keys())
            raise ValidationException(
                f"Unknown provider '{data['llm_provider']}'. "
                f"Valid options: {valid}"
            )
        settings.llm_provider = provider_key

    if "llm_api_key" in data and data["llm_api_key"] is not None:
        if data["llm_api_key"]:  # Only update if non-empty
            settings.llm_api_key = data["llm_api_key"]

    if "llm_base_url" in data:
        settings.llm_base_url = data["llm_base_url"] or None

    if "llm_model" in data:
        settings.llm_model = data["llm_model"] or None

    # ── Path override toggle ──
    if "use_path_llm_override" in data and data["use_path_llm_override"] is not None:
        settings.use_path_llm_override = data["use_path_llm_override"]

    # ── Path LLM override config (only used when use_path_llm_override=True) ──
    if "path_llm_provider" in data and data["path_llm_provider"] is not None:
        provider_key = data["path_llm_provider"].strip().lower()
        if provider_key not in PROVIDERS:
            valid = ", ".join(PROVIDERS.keys())
            raise ValidationException(
                f"Unknown provider '{data['path_llm_provider']}'. "
                f"Valid options: {valid}"
            )
        settings.path_llm_provider = provider_key

    if "path_llm_api_key" in data and data["path_llm_api_key"] is not None:
        if data["path_llm_api_key"]:
            settings.path_llm_api_key = data["path_llm_api_key"]

    if "path_llm_base_url" in data:
        settings.path_llm_base_url = data["path_llm_base_url"] or None

    if "path_llm_model" in data:
        settings.path_llm_model = data["path_llm_model"] or None

    db.commit()
    db.refresh(settings)

    return {
        "llm_provider": settings.llm_provider,
        "llm_api_key_masked": _mask_api_key(settings.llm_api_key),
        "llm_base_url": settings.llm_base_url,
        "llm_model": settings.llm_model,
        "use_path_llm_override": settings.use_path_llm_override,
        "path_llm_provider": settings.path_llm_provider,
        "path_llm_api_key_masked": _mask_api_key(settings.path_llm_api_key),
        "path_llm_base_url": settings.path_llm_base_url,
        "path_llm_model": settings.path_llm_model,
    }


def get_effective_llm_config(db: Session, user_id: str, *, for_path: bool = False) -> dict:
    """Get the effective LLM config for Agent chat or Path generation.

    If for_path=True and use_path_llm_override=True, returns path-specific config.
    Otherwise returns the primary shared config.
    """
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )

    if not settings:
        return {}

    # If Path generation and override is enabled, use path-specific config
    if for_path and settings.use_path_llm_override:
        return {
            "provider": settings.path_llm_provider or settings.llm_provider,
            "api_key": settings.path_llm_api_key or settings.llm_api_key,
            "base_url": settings.path_llm_base_url or settings.llm_base_url,
            "model": settings.path_llm_model or settings.llm_model,
        }

    # Default: shared primary config
    return {
        "provider": settings.llm_provider,
        "api_key": settings.llm_api_key,
        "base_url": settings.llm_base_url,
        "model": settings.llm_model,
    }


def test_llm_connection(
    db: Session,
    user_id: str,
    *,
    config_type: str = "assessment",
    provider: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    model: str | None = None,
) -> dict:
    """Test an LLM connection with the provided or stored config.

    For config_type='mentor', falls back to assessment (llm_*) fields
    for any unset mentor (path_llm_*) fields — matching agent behavior.
    Returns a dict with: success, message, error_type, suggestions, latency_ms.
    """
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )

    # ── Resolve effective config ──
    if config_type == "mentor":
        # Mentor model: path_llm_* with fallback to llm_* (same as agent)
        eff_provider = (
            provider
            or (settings.path_llm_provider if settings else None)
            or (settings.llm_provider if settings else None)
        )
        eff_api_key = (
            api_key
            or (settings.path_llm_api_key if settings else None)
            or (settings.llm_api_key if settings else None)
        )
        eff_base_url = (
            base_url
            or (settings.path_llm_base_url if settings else None)
            or (settings.llm_base_url if settings else None)
        )
        eff_model = (
            model
            or (settings.path_llm_model if settings else None)
            or (settings.llm_model if settings else None)
        )
    else:
        # Assessment model: llm_* only
        eff_provider = provider or (settings.llm_provider if settings else None)
        eff_api_key = api_key or (settings.llm_api_key if settings else None)
        eff_base_url = base_url or (settings.llm_base_url if settings else None)
        eff_model = model or (settings.llm_model if settings else None)

    # ── Validate required fields ──
    if not eff_api_key:
        return {
            "success": False,
            "message": "未配置 API Key，无法测试连接。",
            "error_type": "config",
            "suggestions": [
                "请在 API Key 输入框中填写你的密钥",
                f"如果已填写，请点击「保存」后再测试（测试使用已保存的密钥）",
            ],
            "latency_ms": None,
        }

    if not eff_provider:
        return {
            "success": False,
            "message": "未选择服务商（Provider），无法确定 API 端点。",
            "error_type": "config",
            "suggestions": ["请先选择一个服务商（如 OpenAI、DeepSeek、智谱AI 等）"],
            "latency_ms": None,
        }

    # Resolve provider defaults for base_url and model
    provider_obj = resolve_provider(eff_provider)
    if eff_base_url:
        final_base_url = eff_base_url.strip().rstrip("/")
    else:
        final_base_url = provider_obj.base_url.rstrip("/") if provider_obj.base_url else ""

    if eff_model:
        final_model = eff_model.strip()
    elif provider_obj.default_model:
        final_model = provider_obj.default_model
    else:
        return {
            "success": False,
            "message": "未配置模型名称（Model），无法发起请求。",
            "error_type": "config",
            "suggestions": [
                "请在模型输入框中填写模型名称",
                f"服务商 {provider_obj.name} 的推荐模型：{provider_obj.default_model or '无（需手动填写）'}",
            ],
            "latency_ms": None,
        }

    if not final_base_url:
        return {
            "success": False,
            "message": "未配置 API Base URL，无法确定请求地址。",
            "error_type": "config",
            "suggestions": [
                "请在 Base URL 输入框中填写 API 地址",
                f"服务商 {provider_obj.name} 的默认地址：{provider_obj.base_url or '无（需手动填写）'}",
            ],
            "latency_ms": None,
        }

    # ── Make test LLM call ──
    from openai import OpenAI

    logger.info(
        "LLM connection test — config_type=%s provider=%s model=%s base_url=%s",
        config_type, eff_provider, final_model, final_base_url,
    )

    client_kwargs: dict = {"api_key": eff_api_key}
    if final_base_url:
        client_kwargs["base_url"] = final_base_url
    client = OpenAI(**client_kwargs)

    start = time.time()
    try:
        response = client.chat.completions.create(
            model=final_model,
            messages=[{"role": "user", "content": "Say hi"}],
            max_tokens=5,
            timeout=15,
        )
        latency_ms = int((time.time() - start) * 1000)
        reply = response.choices[0].message.content or ""
        return {
            "success": True,
            "message": f"连接成功！模型返回：{reply.strip()[:50]}",
            "error_type": None,
            "suggestions": [],
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        latency_ms = int((time.time() - start) * 1000)
        return _diagnose_llm_error(exc, eff_provider, final_model, final_base_url, latency_ms)


def _diagnose_llm_error(
    exc: Exception,
    provider: str,
    model: str,
    base_url: str,
    latency_ms: int,
) -> dict:
    """Map an LLM exception to a user-friendly diagnosis with suggestions."""
    exc_type_name = type(exc).__name__
    exc_str = str(exc).lower()

    # ── Import OpenAI error types lazily ──
    try:
        from openai import (
            AuthenticationError,
            NotFoundError,
            RateLimitError,
            APIConnectionError,
            APITimeoutError,
            BadRequestError,
            APIStatusError,
        )
    except ImportError:
        AuthenticationError = NotFoundError = RateLimitError = None
        APIConnectionError = APITimeoutError = BadRequestError = APIStatusError = None

    provider_obj = resolve_provider(provider)
    provider_label = provider_obj.name or provider

    # ── Authentication error (401) ──
    if AuthenticationError and isinstance(exc, AuthenticationError):
        return {
            "success": False,
            "message": f"API Key 认证失败（401）。服务商 {provider_label} 拒绝了你的密钥。",
            "error_type": "auth",
            "suggestions": [
                "检查 API Key 是否正确，有无多余空格或换行",
                "确认 API Key 未过期或被禁用",
                f"前往 {provider_label} 官网重新生成密钥",
            ],
            "latency_ms": latency_ms,
        }

    # ── Not found error (404) — wrong model or endpoint ──
    if NotFoundError and isinstance(exc, NotFoundError):
        if "model" in exc_str:
            return {
                "success": False,
                "message": f"模型「{model}」不存在（404）。服务商 {provider_label} 未找到该模型。",
                "error_type": "not_found",
                "suggestions": [
                    f"检查模型名称拼写是否正确（当前：{model}）",
                    f"{provider_label} 的推荐模型：{provider_obj.default_model or '请查看官方文档'}",
                    "前往服务商官网查看可用模型列表",
                ],
                "latency_ms": latency_ms,
            }
        return {
            "success": False,
            "message": f"API 端点不存在（404）。Base URL 可能错误。",
            "error_type": "not_found",
            "suggestions": [
                f"检查 Base URL 是否正确（当前：{base_url}）",
                f"{provider_label} 的默认地址：{provider_obj.base_url or '无'}",
                "确认 URL 以 /v1 结尾（大多数 OpenAI 兼容服务需要）",
            ],
            "latency_ms": latency_ms,
        }

    # ── Bad request (400) — often wrong model name ──
    if BadRequestError and isinstance(exc, BadRequestError):
        if "model" in exc_str:
            return {
                "success": False,
                "message": f"模型「{model}」不可用或拼写错误（400）。",
                "error_type": "config",
                "suggestions": [
                    f"检查模型名称是否正确（当前：{model}）",
                    f"{provider_label} 的推荐模型：{provider_obj.default_model or '请查看官方文档'}",
                    "前往服务商官网查看可用模型列表",
                ],
                "latency_ms": latency_ms,
            }
        return {
            "success": False,
            "message": f"请求参数错误（400）：{str(exc)[:200]}",
            "error_type": "config",
            "suggestions": ["检查模型名称和 Base URL 是否匹配所选服务商"],
            "latency_ms": latency_ms,
        }

    # ── Connection error — network / wrong base URL ──
    if APIConnectionError and isinstance(exc, APIConnectionError):
        return {
            "success": False,
            "message": f"无法连接到 API 服务。Base URL 可能错误或网络不通。",
            "error_type": "connection",
            "suggestions": [
                f"检查 Base URL 是否正确（当前：{base_url}）",
                f"{provider_label} 的默认地址：{provider_obj.base_url or '无'}",
                "确认网络能访问该地址（可能是防火墙或代理问题）",
                "如果使用本地模型（如 Ollama），确认服务已启动",
            ],
            "latency_ms": latency_ms,
        }

    # ── Timeout ──
    if APITimeoutError and isinstance(exc, APITimeoutError):
        return {
            "success": False,
            "message": "请求超时，API 服务响应过慢。",
            "error_type": "timeout",
            "suggestions": [
                "稍后重试",
                "检查网络连接是否稳定",
                "如果使用本地模型，确认模型已加载完成",
            ],
            "latency_ms": latency_ms,
        }

    # ── Rate limit (429) ──
    if RateLimitError and isinstance(exc, RateLimitError):
        return {
            "success": False,
            "message": "请求频率超限（429）。API Key 调用过于频繁或额度不足。",
            "error_type": "rate_limit",
            "suggestions": [
                "稍等几秒后重试",
                "检查 API 账户余额或配额是否充足",
                f"前往 {provider_label} 官网查看账户状态",
            ],
            "latency_ms": latency_ms,
        }

    # ── Other API status errors ──
    if APIStatusError and isinstance(exc, APIStatusError):
        status_code = getattr(exc, "status_code", "?")
        return {
            "success": False,
            "message": f"API 返回错误（HTTP {status_code}）：{str(exc)[:200]}",
            "error_type": "unknown",
            "suggestions": [
                "查看上方错误信息，根据 HTTP 状态码排查",
                f"前往 {provider_label} 官网查看 API 文档",
            ],
            "latency_ms": latency_ms,
        }

    # ── Generic fallback ──
    return {
        "success": False,
        "message": f"连接失败（{exc_type_name}）：{str(exc)[:200]}",
        "error_type": "unknown",
        "suggestions": [
            "检查 API Key、Base URL、模型名称是否正确",
            f"服务商：{provider_label}，模型：{model}，地址：{base_url}",
            "查看浏览器控制台或后端日志获取更多信息",
        ],
        "latency_ms": latency_ms,
    }
