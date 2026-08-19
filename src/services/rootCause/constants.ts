export const RCA_CONSTANTS = {
  // Cardinality limit: ignore columns with > 80 distinct values as groupings
  MAX_DISTINCT_VALUES_FOR_DIMENSION: 80,
  
  // Minimum records needed for reliable segment inference
  MIN_RECORDS_FOR_SEGMENT_ANALYSIS: 5,
  MIN_TOTAL_RECORDS_FOR_RCA: 10,
  
  // Correlation strength thresholds
  CORRELATION_STRONG_THRESHOLD: 0.7,
  CORRELATION_MODERATE_THRESHOLD: 0.4,
  
  // Top items to inspect
  MAX_TOP_DRIVERS_PER_DIMENSION: 6,
  MAX_DIMENSIONS_TO_ANALYZE: 8,
  MAX_INTERACTIONS_TO_ANALYZE: 5,
  MAX_SUPPORTING_ROWS_SNIPPET: 8,
  
  // Default Pareto cutoff (80% rule)
  PARETO_TARGET_PCT: 80.0,
};

// Known dimension column name heuristics
export const KNOWN_DIMENSION_PATTERNS = [
  'region',
  'state',
  'country',
  'city',
  'territory',
  'zone',
  'category',
  'subcategory',
  'department',
  'product',
  'item',
  'sku',
  'brand',
  'channel',
  'segment',
  'customer_type',
  'tier',
  'store',
  'branch',
  'location',
  'warehouse',
  'salesperson',
  'rep',
  'agent',
  'team',
  'device',
  'platform',
  'browser',
  'payment_method',
  'payment_type',
  'shipping_method',
  'status',
  'priority',
  'source',
  'campaign',
];

// Identifiers to exclude from dimension grouping
export const IDENTIFIER_EXCLUSIONS = [
  'id',
  'uuid',
  'guid',
  'row_id',
  'index',
  'order_id',
  'transaction_id',
  'customer_id',
  'user_id',
  'account_id',
  'session_id',
  'email',
  'phone',
  'address',
  'postal_code',
  'zipcode',
];

// Common metric formulas for mathematical decomposition
export interface MetricFormulaPattern {
  name: string;
  expression: string;
  formulaType: 'multiplication' | 'subtraction' | 'ratio';
  targetAliases: string[];
  components: {
    role: 'component_multiplier' | 'component_divisor' | 'component_subtraction';
    aliases: string[];
    friendlyLabel: string;
  }[];
}

export const COMMON_METRIC_FORMULAS: MetricFormulaPattern[] = [
  {
    name: 'Revenue Decomposition (Volume × Price)',
    expression: 'Revenue = Quantity × Average Price',
    formulaType: 'multiplication',
    targetAliases: ['revenue', 'sales', 'sales_amount', 'total_amount', 'gross_revenue', 'net_sales'],
    components: [
      {
        role: 'component_multiplier',
        aliases: ['quantity', 'qty', 'units', 'items_sold', 'volume', 'order_quantity'],
        friendlyLabel: 'Sales Volume / Quantity',
      },
      {
        role: 'component_multiplier',
        aliases: ['price', 'unit_price', 'avg_price', 'average_price', 'rate'],
        friendlyLabel: 'Unit Price / Rate',
      },
    ],
  },
  {
    name: 'Profit Decomposition (Revenue - Cost)',
    expression: 'Profit = Revenue - Cost',
    formulaType: 'subtraction',
    targetAliases: ['profit', 'net_profit', 'gross_profit', 'margin', 'net_income'],
    components: [
      {
        role: 'component_multiplier',
        aliases: ['revenue', 'sales', 'sales_amount', 'total_amount', 'gross_sales'],
        friendlyLabel: 'Gross Revenue',
      },
      {
        role: 'component_subtraction',
        aliases: ['cost', 'cogs', 'total_cost', 'expense', 'expenses', 'spend'],
        friendlyLabel: 'Total Costs / COGS',
      },
    ],
  },
  {
    name: 'Average Order Value (Revenue / Orders)',
    expression: 'Average Order Value = Revenue / Orders',
    formulaType: 'ratio',
    targetAliases: ['aov', 'average_order_value', 'avg_order_value', 'revenue_per_order'],
    components: [
      {
        role: 'component_multiplier',
        aliases: ['revenue', 'sales', 'sales_amount', 'total_amount'],
        friendlyLabel: 'Total Revenue',
      },
      {
        role: 'component_divisor',
        aliases: ['orders', 'order_count', 'transactions', 'num_orders'],
        friendlyLabel: 'Order Count',
      },
    ],
  },
  {
    name: 'Conversion Rate (Conversions / Visitors)',
    expression: 'Conversion Rate = Conversions / Visitors',
    formulaType: 'ratio',
    targetAliases: ['conversion_rate', 'cvr', 'conv_rate'],
    components: [
      {
        role: 'component_multiplier',
        aliases: ['conversions', 'converted', 'orders', 'sales_count'],
        friendlyLabel: 'Total Conversions',
      },
      {
        role: 'component_divisor',
        aliases: ['visitors', 'sessions', 'traffic', 'impressions', 'clicks'],
        friendlyLabel: 'Total Visitors / Sessions',
      },
    ],
  },
];
