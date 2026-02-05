export interface User {
    id: number;
    email: string;
    name: string;
    avatar_url?: string;
    provider: string;
    created_at: string;
}

export interface Category {
    id: number;
    user_id: number;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
    is_default: boolean;
    is_essential: boolean;
    created_at: string;
}

export interface FinancialScoreResponse {
    score: number;
    consistency_score: number;
    savings_score: number;
    spending_score: number;
    total_income: number;
    total_expense: number;
    essential_expense: number;
    non_essential_expense: number;
    tips: string[];
}

export interface Badge {
    id: number;
    name: string;
    description: string;
    icon: string;
    criteria: string;
}

export interface GamificationStatus {
    level: number;
    xp: number;
    next_level_xp: number;
    current_streak: number;
    longest_streak: number;
    badges: Badge[];
    unlocked_badge_id?: number;
}

export interface Wallet {
    id: number;
    user_id: number;
    name: string;
    icon: string;
    color: string;
    balance: number;
    is_default: boolean;
    description?: string;
    created_at: string;
}

export interface Transaction {
    id: number;
    user_id: number;
    category_id: number;
    wallet_id: number;
    amount: number;  // Amount in IDR (converted)
    original_amount?: number;  // Amount in original currency
    currency?: string;  // Currency code (IDR, USD, etc)
    exchange_rate?: number;  // Rate used for conversion
    type: 'income' | 'expense';
    description: string;
    date: string;
    notes?: string;
    proof_url?: string;
    category?: Category;
    wallet?: Wallet;
    created_at: string;
}

export interface CurrencyInfo {
    code: string;
    name: string;
    rate: number;  // Rate to IDR
    symbol: string;
}

export interface CurrencyResponse {
    currencies: CurrencyInfo[];
    base: string;
    source: 'api' | 'offline';
    updated_at: string;
}

export interface Budget {
    id: number;
    user_id: number;
    category_id: number;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    spent: number;
    remaining: number;
    percentage: number;
    category?: Category;
    created_at: string;
}

export interface DashboardSummary {
    total_income: number;
    total_expense: number;
    balance: number;
    transaction_count: number;
    recent_transactions: Transaction[];
    category_spending: CategorySpending[];
    budget_progress: BudgetProgress[];
    daily_trends: DailyTrend[];
    income_change_pct: number;
    expense_change_pct: number;
    monthly_income: number;
    monthly_expense: number;
}

export interface CategorySpending {
    category_id: number;
    category_name: string;
    category_icon: string;
    color: string;
    amount: number;
    percentage: number;
    period?: string;
    change_pct?: number; // New field for MoM change
}

export interface BudgetProgress {
    category_id: number;
    category_name: string;
    budget_amount: number;
    spent_amount: number;
    remaining: number;
    percentage: number;
}

export interface DailyTrend {
    date: string;
    income: number;
    expense: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface TransactionListResponse {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
}

export interface Goal {
    id: number;
    user_id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    icon: string;
    color: string;
    description?: string;
    created_at: string;
    members?: { user_id: number; role: string; user?: User }[];
    items?: GoalItem[];
    transactions?: GoalTransaction[];
    user?: User;
}

export interface GoalTransaction {
    id: number;
    goal_id: number;
    user_id: number;
    amount: number;
    date: string;
    notes: string;
    created_at: string;
    user?: User;
}

export interface RecurringTransaction {
    id: number;
    user_id: number;
    wallet_id: number;
    category_id: number;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    start_date: string;
    next_run_date: string;
    is_active: boolean;
    last_run_date?: string;
    wallet?: Wallet;
    category?: Category;
}

export interface GoalItem {
    id: number;
    goal_id: number;
    name: string;
    estimated_price: number;
    actual_price: number;
    is_purchased: boolean;
    note: string;
    created_at: string;
    updated_at: string;
}

export interface CategoryBreakdown {
    category_id: number;
    category_name: string;
    category_icon: string;
    amount: number;
    percentage: number;
}

export interface MonthComparison {
    income_change: number;
    expense_change: number;
    savings_change: number;
}

export interface DailyData {
    date: string;
    income: number;
    expense: number;
}

export interface MonthlyReport {
    year: number;
    month: number;
    total_income: number;
    total_expense: number;
    net_savings: number;
    savings_rate: number;
    category_breakdown: CategoryBreakdown[];
    comparison: MonthComparison;
    daily_trend: DailyData[];
    transaction_count: number;
}

export interface Debt {
    ID: number;
    user_id: number;
    type: 'payable' | 'receivable';
    person_name: string;
    amount: number;
    description: string;
    due_date?: string;
    status: 'unpaid' | 'paid';
    created_at?: string;
    updated_at?: string;
}

export interface DebtSummary {
    total_payable: number;
    total_receivable: number;
}

export interface CalendarEvent {
    id: number;
    date: string; // YYYY-MM-DD
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'debt_payable' | 'debt_receivable';
    source: 'recurring' | 'debt';
    source_id: number;
    category_icon?: string;
}

export interface CalendarResponse {
    events: CalendarEvent[];
    month: number;
    year: number;
}
