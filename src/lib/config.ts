import pool from '@/lib/db';

// ============================================================
// CONFIG HELPER — Database-driven configuration with caching
// ============================================================

// Simple in-memory cache with TTL
const cache: Record<string, { value: any; expires: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
    const entry = cache[key];
    if (entry && Date.now() < entry.expires) return entry.value;
    return null;
}

function setCache(key: string, value: any): void {
    cache[key] = { value, expires: Date.now() + CACHE_TTL };
}

// ---- PlatformConfig ----

export async function getConfig(key: string, fallback: string = ''): Promise<string> {
    const cacheKey = `config:${key}`;
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;

    try {
        const [rows]: any = await pool.query(
            'SELECT config_value FROM PlatformConfig WHERE config_key = ?', [key]
        );
        const value = rows.length > 0 ? rows[0].config_value : fallback;
        setCache(cacheKey, value);
        return value;
    } catch {
        return fallback;
    }
}

export async function getConfigNumber(key: string, fallback: number = 0): Promise<number> {
    const value = await getConfig(key, String(fallback));
    return parseFloat(value) || fallback;
}

// ---- RefundPolicy ----

export interface RefundRule {
    min_days_before: number;
    refund_percentage: number;
    description: string;
}

export async function getRefundPolicy(): Promise<RefundRule[]> {
    const cacheKey = 'refund_policy';
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;

    try {
        const [rows]: any = await pool.query(
            'SELECT min_days_before, refund_percentage, description FROM RefundPolicy WHERE is_active = TRUE ORDER BY min_days_before DESC'
        );
        setCache(cacheKey, rows);
        return rows;
    } catch {
        // Fallback defaults
        return [
            { min_days_before: 7, refund_percentage: 100, description: 'Full refund' },
            { min_days_before: 2, refund_percentage: 50, description: 'Half refund' },
            { min_days_before: 0, refund_percentage: 0, description: 'No refund' },
        ];
    }
}

export async function calculateRefund(daysBeforeEvent: number): Promise<{ percentage: number; description: string }> {
    const policies = await getRefundPolicy();
    for (const policy of policies) {
        if (daysBeforeEvent > policy.min_days_before) {
            return { percentage: policy.refund_percentage, description: policy.description };
        }
    }
    return { percentage: 0, description: 'No refund available' };
}

// ---- PaginationConfig ----

export async function getPaginationLimit(routeName: string, requested?: number): Promise<number> {
    const cacheKey = `pagination:${routeName}`;
    const cached = getCached(cacheKey);

    let defaultLimit = 20;
    let maxLimit = 100;

    if (cached) {
        defaultLimit = cached.defaultLimit;
        maxLimit = cached.maxLimit;
    } else {
        try {
            const [rows]: any = await pool.query(
                'SELECT default_limit, max_limit FROM PaginationConfig WHERE route_name = ?', [routeName]
            );
            if (rows.length > 0) {
                defaultLimit = rows[0].default_limit;
                maxLimit = rows[0].max_limit;
                setCache(cacheKey, { defaultLimit, maxLimit });
            }
        } catch {
            // Use defaults
        }
    }

    const limit = requested ? Math.min(requested, maxLimit) : defaultLimit;
    return limit;
}

// ---- NotificationTemplate ----

export async function getNotificationTemplate(type: string, vars: Record<string, string> = {}): Promise<string> {
    const cacheKey = `notification:${type}`;
    const cached = getCached(cacheKey);

    let template = cached;
    if (!template) {
        try {
            const [rows]: any = await pool.query(
                'SELECT template_body FROM NotificationTemplate WHERE notification_type = ? AND is_active = TRUE', [type]
            );
            template = rows.length > 0 ? rows[0].template_body : type;
            setCache(cacheKey, template);
        } catch {
            template = type;
        }
    }

    // Replace variables like {event_title}, {refund_amount}
    let message = template;
    for (const [key, value] of Object.entries(vars)) {
        message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return message;
}
