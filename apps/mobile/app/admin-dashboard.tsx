import { Feather } from "@expo/vector-icons";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { Order, OrderStatus, PaymentMethod, orderStatusLabels, paymentMethodLabels } from "@harvest/domain";
import {
  Circle as SkiaCircle,
  DashPathEffect,
  Group as SkiaGroup,
  Line as SkiaLine,
  RoundedRect,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Extrapolation, interpolate, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { Area, Bar, CartesianChart, Line, Pie, PolarChart, useChartPressState } from "victory-native";
import { AdminPanel, ProgressRow } from "../components/admin-ui";
import { Card, EmptyState, colors, fontFamilies, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { getCategorySales, getStatusStats, getTopCustomers, getTopProducts } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type TimeRange = "week" | "month" | "all";

const rangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: "7 Days", value: "week" },
  { label: "30 Days", value: "month" },
  { label: "90 Days", value: "all" },
];

const metricTones = {
  blue: { ...colors.metric.blue, icon: "shopping-bag" },
  green: { ...colors.metric.green, icon: "dollar-sign" },
  orange: { ...colors.metric.orange, icon: "clock" },
  purple: { ...colors.metric.purple, icon: "check-circle" },
} as const;

const chartPalette = {
  primary: colors.chart.series[0],
  primarySoft: colors.chart.primarySoft,
  amber: colors.chart.series[1],
  green: colors.chart.series[2],
  purple: colors.chart.series[3],
  muted: colors.chart.series[4],
  warning: colors.chart.series[5],
};

const chartTokens = {
  areaFill: colors.chart.areaFill,
  axisFrame: colors.chart.axisFrame,
  guideActive: colors.chart.guideActive,
  guideIdle: colors.chart.guideIdle,
  guideSoftActive: colors.chart.guideSoftActive,
  guideSoftIdle: colors.chart.guideSoftIdle,
  gridHidden: colors.chart.gridHidden,
  gridLine: colors.chart.gridLine,
  pointSurface: colors.chart.pointSurface,
  primaryTint: colors.chart.primaryTint,
  tooltipForeground: colors.chart.tooltipForeground,
  tooltipMuted: colors.chart.tooltipMuted,
  tooltipSurface: colors.chart.tooltipSurface,
  xAxisFrame: colors.chart.xAxisFrame,
};

const chartSeries = colors.chart.series;

type ChartDatum = {
  color?: string;
  label: string;
  legendLabel?: string;
  meta?: string;
  value: number;
};

function getChartSeriesColor(index: number) {
  return chartSeries[index % chartSeries.length];
}

function getStatusChartColor(status: OrderStatus) {
  const statusColorMap: Record<OrderStatus, string> = {
    delivered: chartPalette.green,
    in_transit: chartPalette.amber,
    preparing: chartPalette.primary,
  };

  return statusColorMap[status];
}

export default function AdminDashboardScreen() {
  const { orders, products, users } = useMobileState();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, Math.min(width - 40, 536));

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const paidRevenue = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
  const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
  const topProducts = getTopProducts(orders);
  const topCustomers = getTopCustomers(orders);
  const statusStats = getStatusStats(orders);
  const categorySales = getCategorySales(orders, products);
  const paymentStats = getPaymentStats(orders);
  const salesTrend = useMemo(() => getSalesTrendData(orders, timeRange), [orders, timeRange]);
  const maxProductRevenue = Math.max(...topProducts.map((product) => product.revenue), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((customer) => customer.totalSpent), 1);
  const salesTrendChartData: ChartDatum[] = salesTrend.map((row) => ({
    label: row.label,
    value: row.revenue,
  }));
  const categoryChartData: ChartDatum[] = categorySales.slice(0, 6).map((row, index) => ({
    color: getChartSeriesColor(index),
    label: shortChartLabel(row.category),
    legendLabel: row.category,
    meta: `${row.quantity} units · ${formatCurrency(row.revenue)}`,
    value: row.revenue,
  }));
  const statusChartData: ChartDatum[] = statusStats.map((row) => ({
    color: getStatusChartColor(row.status),
    label: shortStatusLabel(row.status),
    legendLabel: orderStatusLabels[row.status],
    meta: `${row.count} orders · ${formatCurrency(row.revenue)}`,
    value: row.count,
  }));
  const paymentChartData: ChartDatum[] = paymentStats.map((payment, index) => ({
    color: getChartSeriesColor(index),
    label: paymentMethodLabels[payment.method],
    meta: `${payment.count} orders · ${formatCurrency(payment.amount)}`,
    value: payment.amount,
  }));

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Business statistics" />

      <View style={adminStyles.rangeTabs}>
        {rangeOptions.map((option) => {
          const active = option.value === timeRange;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={option.value}
              onPress={() => setTimeRange(option.value)}
              style={({ pressed }) => [adminStyles.rangeButton, active && adminStyles.rangeButtonActive, pressed && styles.pressed]}
            >
              <Text style={[adminStyles.rangeText, active && adminStyles.rangeTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {lowStockProducts.length > 0 || outOfStockProducts.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push("/admin-stock")} style={({ pressed }) => pressed && styles.pressed}>
          <StatusBanner
            title="Stock Alerts"
            body={`${lowStockProducts.length} low stock, ${outOfStockProducts.length} out of stock. Tap to manage stock.`}
          />
        </Pressable>
      ) : null}

      <View style={adminStyles.grid}>
        <MetricCard label="Total revenue" tone="green" value={formatCurrency(totalRevenue)} />
        <MetricCard label="Collected" tone="purple" value={formatCurrency(paidRevenue)} />
        <MetricCard label="Pending payment" tone="orange" value={formatCurrency(pendingRevenue)} />
        <MetricCard label="Total orders" tone="blue" value={String(orders.length)} />
      </View>

      <Card>
        <View style={adminStyles.salesTrendHeader}>
          <View style={styles.flex}>
            <Text style={adminStyles.salesTrendTitle}>Sales trends</Text>
            <Text style={styles.muted}>Revenue across the selected period</Text>
          </View>
          <View style={adminStyles.salesTrendPill}>
            <LegendDot color={chartPalette.primary} label="Revenue" />
          </View>
        </View>
        {salesTrend.every((row) => row.revenue === 0 && row.orders === 0) ? (
          <Text style={styles.description}>No sales trend data yet.</Text>
        ) : (
          <View style={adminStyles.chartWrap}>
            <AreaChartCard
              data={salesTrendChartData}
              legendMeta={`${salesTrend.reduce((sum, row) => sum + row.orders, 0)} orders`}
              width={chartWidth}
            />
          </View>
        )}
      </Card>

      <AdminPanel title="Sales by category">
        {categorySales.length === 0 ? (
          <Text style={styles.description}>No category sales yet.</Text>
        ) : (
          <View style={adminStyles.chartWrap}>
            <BarChartCard data={categoryChartData} width={chartWidth} />
            <ChartLegend items={categoryChartData} />
          </View>
        )}
      </AdminPanel>

      <AdminPanel title="Order status">
        <View style={adminStyles.chartWrap}>
          <BarChartCard data={statusChartData} valueFormatter={(value) => String(value)} width={chartWidth} />
          <ChartLegend items={statusChartData} />
        </View>
      </AdminPanel>

      <AdminPanel title="Payment methods distribution">
        {paymentStats.length === 0 ? (
          <Text style={styles.description}>No payment data yet.</Text>
        ) : (
          <View style={adminStyles.paymentChartWrap}>
            <DonutChartCard
              data={paymentChartData}
              totalLabel={formatCurrency(totalRevenue)}
            />
            <ChartLegend items={paymentChartData} />
          </View>
        )}
      </AdminPanel>

      <AdminPanel title="Top products">
        {topProducts.length === 0 ? (
          <EmptyState title="No product sales" body="Orders will populate product rankings." />
        ) : (
          topProducts.slice(0, 8).map((product) => (
            <ProgressRow
              key={product.name}
              label={product.name}
              sublabel={`${product.quantity} units`}
              value={formatCurrency(product.revenue)}
              width={(product.revenue / maxProductRevenue) * 100}
            />
          ))
        )}
      </AdminPanel>

      <AdminPanel title="Best customers">
        {topCustomers.length === 0 ? (
          <Text style={styles.description}>No customers yet.</Text>
        ) : (
          topCustomers.slice(0, 5).map((customer) => (
            <ProgressRow
              key={customer.email}
              label={customer.email.split("@")[0]}
              sublabel={`${customer.orderCount} orders`}
              value={formatCurrency(customer.totalSpent)}
              width={(customer.totalSpent / maxCustomerSpent) * 100}
            />
          ))
        )}
      </AdminPanel>

      <AdminPanel title="Recent activities">
        {orders.length === 0 ? (
          <EmptyState title="No recent activity" body="New orders will appear here." />
        ) : (
          orders.slice(0, 10).map((order) => (
            <Pressable
              accessibilityRole="button"
              key={order.id}
              style={({ pressed }) => [adminStyles.activity, pressed && styles.pressed]}
              onPress={() => router.push(`/order/${order.id}`)}
            >
              <View style={adminStyles.activityIcon}>
                <Feather color={colors.foreground} name="package" size={16} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>Order #{order.orderNumber}</Text>
                <Text style={styles.muted}>{order.customerEmail}</Text>
              </View>
              <Text style={styles.price}>{formatCurrency(order.totalAmount)}</Text>
            </Pressable>
          ))
        )}
      </AdminPanel>

      <Text style={styles.muted}>{users.length} users loaded for admin reporting.</Text>
    </ScrollContent>
  );
}

function AreaChartCard({
  data,
  legendMeta,
  width,
}: {
  data: ChartDatum[];
  legendMeta: string;
  width: number;
}) {
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { revenue: 0 } });
  const [hasSelection, setHasSelection] = useState(false);
  const selectedXPosition = useSharedValue(0);
  const selectedYPosition = useSharedValue(0);
  const selectedXValue = useSharedValue(0);
  const selectedRevenue = useSharedValue(0);
  const selectionReady = useSharedValue(false);
  const axisFont = useFont(PlusJakartaSans_500Medium, 10);
  const tooltipFont = useFont(PlusJakartaSans_500Medium, 11);
  const tooltipValueFont = useFont(PlusJakartaSans_500Medium, 12);
  const max = getNiceMax(data.map((item) => item.value));
  const chartHeight = 258;
  const plotLeft = 8;
  const plotRight = 8;
  const plotTop = 18;
  const plotBottom = 34;
  const xTickValues = data.map((_, index) => index);
  const chartLabels = data.map((item) => item.label);
  const chartData = data.map((item, index) => ({
    label: item.label,
    revenue: item.value,
    x: index,
  }));

  useAnimatedReaction(
    () => ({
      active: pressState.isActive.value,
      revenue: pressState.y.revenue.value.value,
      xPosition: pressState.x.position.value,
      xValue: Number(pressState.x.value.value) || 0,
      yPosition: pressState.y.revenue.position.value,
    }),
    (current) => {
      if (!current.active || current.yPosition <= 0) return;
      selectedXPosition.value = current.xPosition;
      selectedYPosition.value = current.yPosition;
      selectedXValue.value = current.xValue;
      selectedRevenue.value = current.revenue;
      if (!selectionReady.value) {
        selectionReady.value = true;
        runOnJS(setHasSelection)(true);
      }
    },
    [],
  );

  const tooltipX = useDerivedValue(() => {
    const raw = selectedXPosition.value - 58;
    return interpolate(raw, [-58, width - 116], [8, width - 124], Extrapolation.CLAMP);
  }, [width]);
  const tooltipY = useDerivedValue(() => {
    const raw = selectedYPosition.value - 48;
    return interpolate(raw, [-48, chartHeight - 72], [8, chartHeight - 72], Extrapolation.CLAMP);
  }, [chartHeight]);
  const tooltipTextX = useDerivedValue(() => tooltipX.value + 12, []);
  const tooltipDateY = useDerivedValue(() => tooltipY.value + 21, []);
  const tooltipValueY = useDerivedValue(() => tooltipY.value + 43, []);
  const tooltipDate = useDerivedValue(() => {
    const index = Math.max(0, Math.min(chartLabels.length - 1, Math.round(selectedXValue.value)));
    return chartLabels[index] ?? "";
  }, [chartLabels]);
  const tooltipRevenue = useDerivedValue(() => {
    const value = selectedRevenue.value;
    if (!Number.isFinite(value) || value === 0) return "£0";
    if (value >= 1000) return `£${Math.round(value / 1000)}k`;
    return `£${Math.round(value)}`;
  }, []);
  const verticalLineStart = useDerivedValue(() => ({ x: selectedXPosition.value, y: plotTop }), []);
  const verticalLineEnd = useDerivedValue(() => ({ x: selectedXPosition.value, y: chartHeight - plotBottom }), [chartHeight]);
  const horizontalLineStart = useDerivedValue(() => ({ x: plotLeft, y: selectedYPosition.value }), []);
  const horizontalLineEnd = useDerivedValue(() => ({ x: width - plotRight, y: selectedYPosition.value }), [width]);

  return (
    <View style={adminStyles.victoryFrame}>
      <View style={[adminStyles.victoryChart, { height: chartHeight, width }]}>
        <CartesianChart
          axisOptions={{
            axisSide: { x: "bottom", y: "left" },
            font: axisFont,
            formatXLabel: (value) => data[Number(value)]?.label ?? "",
            formatYLabel: (value) => compactCurrency(Number(value)),
            labelColor: { x: colors.muted, y: colors.muted },
            labelOffset: { x: 9, y: 0 },
            labelPosition: { x: "outset", y: "outset" },
            lineColor: { frame: chartTokens.axisFrame, grid: { x: chartTokens.gridHidden, y: chartTokens.gridLine } },
            lineWidth: { frame: 0.5, grid: { x: 0, y: 1 } },
            tickCount: { x: data.length, y: 5 },
            tickValues: { x: xTickValues, y: getYAxisTicks(max) },
          }}
          chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
          chartPressState={pressState}
          data={chartData}
          domain={{ y: [0, max] }}
          domainPadding={{ left: 2, right: 8, top: 28, bottom: 0 }}
          explicitSize={{ height: chartHeight, width }}
          frame={{
            lineColor: chartTokens.xAxisFrame,
            lineWidth: { bottom: 1, left: 0, right: 0, top: 0 },
          }}
          padding={{ bottom: plotBottom, left: plotLeft, right: plotRight, top: plotTop }}
          renderOutside={() => (
            hasSelection ? (
              <SkiaGroup>
                <SkiaLine
                  color={isActive ? chartTokens.guideActive : chartTokens.guideIdle}
                  p1={verticalLineStart}
                  p2={verticalLineEnd}
                  strokeWidth={1.25}
                >
                  <DashPathEffect intervals={[5, 7]} />
                </SkiaLine>
                <SkiaLine
                  color={isActive ? chartTokens.guideSoftActive : chartTokens.guideSoftIdle}
                  p1={horizontalLineStart}
                  p2={horizontalLineEnd}
                  strokeWidth={1.1}
                />
                <SkiaCircle color={chartTokens.pointSurface} cx={selectedXPosition} cy={selectedYPosition} r={6.2} />
                <SkiaCircle color={chartPalette.primary} cx={selectedXPosition} cy={selectedYPosition} r={3.5} />
                <RoundedRect color={chartTokens.tooltipSurface} height={56} r={14} width={116} x={tooltipX} y={tooltipY} />
                {tooltipFont ? (
                  <SkiaText color={chartTokens.tooltipMuted} font={tooltipFont} text={tooltipDate} x={tooltipTextX} y={tooltipDateY} />
                ) : null}
                {tooltipValueFont ? (
                  <SkiaText color={chartTokens.tooltipForeground} font={tooltipValueFont} text={tooltipRevenue} x={tooltipTextX} y={tooltipValueY} />
                ) : null}
              </SkiaGroup>
            ) : null
          )}
          xKey="x"
          yKeys={["revenue"]}
        >
          {({ chartBounds, points }) => (
            <>
              <Area
                animate={{ duration: 650, type: "timing" }}
                color={chartTokens.areaFill}
                curveType="natural"
                points={points.revenue}
                y0={chartBounds.bottom}
              />
              <Line
                animate={{ duration: 650, type: "timing" }}
                color={chartPalette.primary}
                curveType="natural"
                points={points.revenue}
                strokeCap="round"
                strokeJoin="round"
                strokeWidth={2.35}
              />
            </>
          )}
        </CartesianChart>
      </View>
      <View style={adminStyles.victoryLegendRow}>
        <View>
          <Text style={adminStyles.chartHint}>{hasSelection ? "Last selected point stays pinned" : "Tap or drag for exact values"}</Text>
        </View>
        <View style={adminStyles.victoryLegendMeta}>
          <Text style={adminStyles.victoryLegendValue}>{formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}</Text>
          <Text style={styles.muted}>{legendMeta}</Text>
        </View>
      </View>
    </View>
  );
}

function BarChartCard({
  data,
  valueFormatter = compactCurrency,
  width,
}: {
  data: ChartDatum[];
  valueFormatter?: (value: number) => string;
  width: number;
}) {
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { barValue: 0 } });
  const [hasSelection, setHasSelection] = useState(false);
  const selectedXPosition = useSharedValue(0);
  const selectedYPosition = useSharedValue(0);
  const selectedXValue = useSharedValue(0);
  const selectedValue = useSharedValue(0);
  const selectionReady = useSharedValue(false);
  const axisFont = useFont(PlusJakartaSans_500Medium, 10);
  const labelFont = useFont(PlusJakartaSans_500Medium, 11);
  const tooltipFont = useFont(PlusJakartaSans_500Medium, 11);
  const tooltipValueFont = useFont(PlusJakartaSans_500Medium, 12);
  const height = 258;
  const plotTop = 18;
  const plotBottom = 34;
  const plotLeft = 8;
  const plotRight = 8;
  const max = getNiceMax(data.map((item) => item.value));
  const chartData = data.map((item, index) => ({
    barValue: item.value,
    label: item.label,
    x: index,
  }));
  const xTickValues = data.map((_, index) => index);
  const chartLabels = data.map((item) => item.legendLabel ?? item.label);
  const isCountChart = valueFormatter !== compactCurrency;
  const barWidth = Math.max(18, Math.min(34, (width - 40) / Math.max(data.length * 1.85, 1)));
  const barDomainPadding = Math.ceil(barWidth / 2) + 8;

  useAnimatedReaction(
    () => ({
      active: pressState.isActive.value,
      value: pressState.y.barValue.value.value,
      xPosition: pressState.x.position.value,
      xValue: Number(pressState.x.value.value) || 0,
      yPosition: pressState.y.barValue.position.value,
    }),
    (current) => {
      if (!current.active || current.yPosition <= 0) return;
      selectedXPosition.value = current.xPosition;
      selectedYPosition.value = current.yPosition;
      selectedXValue.value = current.xValue;
      selectedValue.value = current.value;
      if (!selectionReady.value) {
        selectionReady.value = true;
        runOnJS(setHasSelection)(true);
      }
    },
    [],
  );

  const tooltipX = useDerivedValue(() => {
    const raw = selectedXPosition.value - 58;
    return interpolate(raw, [-58, width - 116], [8, width - 124], Extrapolation.CLAMP);
  }, [width]);
  const tooltipY = useDerivedValue(() => {
    const raw = selectedYPosition.value - 48;
    return interpolate(raw, [-48, height - 72], [8, height - 72], Extrapolation.CLAMP);
  }, [height]);
  const tooltipTextX = useDerivedValue(() => tooltipX.value + 12, []);
  const tooltipDateY = useDerivedValue(() => tooltipY.value + 21, []);
  const tooltipValueY = useDerivedValue(() => tooltipY.value + 43, []);
  const tooltipLabel = useDerivedValue(() => {
    const index = Math.max(0, Math.min(chartLabels.length - 1, Math.round(selectedXValue.value)));
    return chartLabels[index] ?? "";
  }, [chartLabels]);
  const tooltipValue = useDerivedValue(() => {
    const value = selectedValue.value;
    if (!Number.isFinite(value)) return isCountChart ? "0" : "£0";
    if (isCountChart) return String(Math.round(value));
    if (value === 0) return "£0";
    if (value >= 1000) return `£${Math.round(value / 1000)}k`;
    return `£${Math.round(value)}`;
  }, [isCountChart]);
  const verticalLineStart = useDerivedValue(() => ({ x: selectedXPosition.value, y: plotTop }), []);
  const verticalLineEnd = useDerivedValue(() => ({ x: selectedXPosition.value, y: height - plotBottom }), [height]);
  const horizontalLineStart = useDerivedValue(() => ({ x: plotLeft, y: selectedYPosition.value }), []);
  const horizontalLineEnd = useDerivedValue(() => ({ x: width - plotRight, y: selectedYPosition.value }), [width]);

  return (
    <View style={adminStyles.victoryFrame}>
      <View style={[adminStyles.victoryChart, { height, width }]}>
      <CartesianChart
        axisOptions={{
          axisSide: { x: "bottom", y: "left" },
          font: axisFont,
          formatXLabel: (value) => data[Number(value)]?.label ?? "",
          formatYLabel: (value) => valueFormatter(Number(value)),
          labelColor: { x: colors.muted, y: colors.muted },
          labelOffset: { x: 9, y: 0 },
          labelPosition: { x: "outset", y: "outset" },
          lineColor: { frame: chartTokens.axisFrame, grid: { x: chartTokens.gridHidden, y: chartTokens.gridLine } },
          lineWidth: { frame: 0.5, grid: { x: 0, y: 1 } },
          tickCount: { x: data.length, y: 5 },
          tickValues: { x: xTickValues, y: getYAxisTicks(max) },
        }}
        chartPressConfig={{ pan: { activateAfterLongPress: 0 } }}
        chartPressState={pressState}
        data={chartData}
        domain={{ y: [0, max] }}
        domainPadding={{ left: barDomainPadding, right: barDomainPadding, top: 28, bottom: 0 }}
        explicitSize={{ height, width }}
        frame={{
          lineColor: chartTokens.xAxisFrame,
          lineWidth: { bottom: 1, left: 0, right: 0, top: 0 },
        }}
        padding={{ bottom: plotBottom, left: plotLeft, right: plotRight, top: plotTop }}
        renderOutside={() => (
          hasSelection ? (
            <SkiaGroup>
              <SkiaLine
                color={isActive ? chartTokens.guideActive : chartTokens.guideIdle}
                p1={verticalLineStart}
                p2={verticalLineEnd}
                strokeWidth={1.25}
              >
                <DashPathEffect intervals={[5, 7]} />
              </SkiaLine>
              <SkiaLine
                color={isActive ? chartTokens.guideSoftActive : chartTokens.guideSoftIdle}
                p1={horizontalLineStart}
                p2={horizontalLineEnd}
                strokeWidth={1.1}
              />
              <SkiaCircle color={chartTokens.pointSurface} cx={selectedXPosition} cy={selectedYPosition} r={6.2} />
              <SkiaCircle color={chartPalette.primary} cx={selectedXPosition} cy={selectedYPosition} r={3.5} />
              <RoundedRect color={chartTokens.tooltipSurface} height={56} r={14} width={116} x={tooltipX} y={tooltipY} />
              {tooltipFont ? (
                <SkiaText color={chartTokens.tooltipMuted} font={tooltipFont} text={tooltipLabel} x={tooltipTextX} y={tooltipDateY} />
              ) : null}
              {tooltipValueFont ? (
                <SkiaText color={chartTokens.tooltipForeground} font={tooltipValueFont} text={tooltipValue} x={tooltipTextX} y={tooltipValueY} />
              ) : null}
            </SkiaGroup>
          ) : null
        )}
        xKey="x"
        yKeys={["barValue"]}
      >
        {({ chartBounds, points }) => (
          <>
            {data.map((item, index) => (
              <Bar
                animate={{ duration: 520, type: "timing" }}
                barCount={data.length}
                barWidth={barWidth}
                chartBounds={chartBounds}
                color={item.color ?? chartPalette.primary}
                key={`${item.label}-${index}`}
                labels={{
                  color: colors.foreground,
                  font: labelFont,
                  formatLabel: (value) => valueFormatter(Number(value)),
                  position: "top",
                }}
                points={points.barValue[index] ? [points.barValue[index]] : []}
                roundedCorners={{
                  topLeft: 10,
                  topRight: 10,
                }}
              />
            ))}
          </>
        )}
      </CartesianChart>
      </View>
    </View>
  );
}

function DonutChartCard({ data, totalLabel }: { data: ChartDatum[]; totalLabel: string }) {
  const size = 212;
  const chartData = data.map((item) => ({
    color: item.color ?? chartPalette.primary,
    label: item.label,
    value: item.value,
  }));

  return (
    <View style={adminStyles.donutChartFrame}>
      <View style={[adminStyles.donutChartBox, { height: size, width: size }]}>
        <PolarChart
          colorKey="color"
          data={chartData}
          explicitSize={{ height: size, width: size }}
          labelKey="label"
          valueKey="value"
        >
          <Pie.Chart innerRadius="58%" startAngle={-90}>
            {() => (
              <Pie.Slice animate={{ duration: 650, type: "timing" }}>
                <Pie.SliceAngularInset angularInset={{ angularStrokeWidth: 3, angularStrokeColor: colors.secondary }} />
              </Pie.Slice>
            )}
          </Pie.Chart>
        </PolarChart>
        <View pointerEvents="none" style={adminStyles.donutCenterOverlay}>
          <Text style={adminStyles.donutValue}>{totalLabel}</Text>
          <Text style={adminStyles.donutLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

function ChartLegend({ items }: { items: ChartDatum[] }) {
  return (
    <View style={adminStyles.chartLegend}>
      {items.map((item, index) => (
        <View key={`${item.legendLabel ?? item.label}-${index}`} style={adminStyles.legendLine}>
          <LegendDot color={item.color ?? chartPalette.primary} label={item.legendLabel ?? item.label} />
          {item.meta ? <Text style={adminStyles.legendMetaText}>{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={adminStyles.legendDotRow}>
      <View style={[adminStyles.legendDot, { backgroundColor: color }]} />
      <Text style={adminStyles.legendText}>{label}</Text>
    </View>
  );
}

function getNiceMax(values: number[]) {
  const raw = Math.max(...values, 1);
  if (raw <= 4) return Math.max(1, Math.ceil(raw));
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return Math.ceil(raw / magnitude) * magnitude;
}

function getYAxisTicks(max: number) {
  return Array.from({ length: 5 }, (_, index) => (max / 4) * index);
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: keyof typeof metricTones;
  value: string;
}) {
  const colorsForTone = metricTones[tone];

  return (
    <View style={[adminStyles.metricCard, { backgroundColor: colorsForTone.background }]}>
      <View style={adminStyles.metricHeader}>
        <Text style={[adminStyles.metricLabel, { color: colorsForTone.color }]}>{label}</Text>
        <View style={adminStyles.metricIcon}>
          <Feather color={colorsForTone.color} name={colorsForTone.icon} size={17} />
        </View>
      </View>
      <Text style={[adminStyles.metricValue, { color: colorsForTone.color }]}>{value}</Text>
    </View>
  );
}

function getPaymentStats(orders: Order[]) {
  const stats = new Map<PaymentMethod, { amount: number; count: number; method: PaymentMethod }>();
  orders.forEach((order) => {
    const current = stats.get(order.paymentMethod) ?? { amount: 0, count: 0, method: order.paymentMethod };
    current.amount += order.totalAmount;
    current.count += 1;
    stats.set(order.paymentMethod, current);
  });
  return [...stats.values()].sort((a, b) => b.amount - a.amount);
}

function getSalesTrendData(orders: Order[], range: TimeRange) {
  const days = range === "week" ? 7 : range === "month" ? 30 : 90;
  const bucketCount = 7;
  const today = stripTime(new Date());
  const start = new Date(today);
  start.setDate(today.getDate() - days + 1);
  const bucketSize = Math.ceil(days / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * bucketSize);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + bucketSize);
    const bucketOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= bucketStart && createdAt < bucketEnd;
    });

    return {
      key: bucketStart.toISOString(),
      label: range === "week"
        ? bucketStart.toLocaleDateString("en-GB", { weekday: "short" })
        : bucketStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      orders: bucketOrders.length,
      revenue: bucketOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });
}

function compactCurrency(value: number) {
  if (!Number.isFinite(value) || value === 0) return "£0";
  if (value >= 1000) return `£${Math.round(value / 1000)}k`;
  return `£${Math.round(value)}`;
}

function shortChartLabel(label: string) {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length === 0) return label;
  if (words.length === 1) return words[0].slice(0, 8);
  return words.map((word) => word[0]).join("").slice(0, 5).toUpperCase();
}

function shortStatusLabel(status: string) {
  if (status === "preparing") return "Prep";
  if (status === "in_transit") return "Transit";
  if (status === "delivered") return "Done";
  return status;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const adminStyles = StyleSheet.create({
  activity: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingTop: 11,
  },
  activityIcon: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  axisLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 9,
  },
  chartLegend: {
    gap: 7,
    paddingTop: 2,
  },
  chartLegendRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartFrame: {
    alignItems: "center",
    alignSelf: "stretch",
    overflow: "hidden",
  },
  chartHint: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
  },
  chartTopLabel: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
  },
  chartWrap: {
    gap: 12,
    overflow: "visible",
  },
  donutCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
  donutChartFrame: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  donutChartBox: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutCenterOverlay: {
    alignItems: "center",
    bottom: 0,
    gap: 2,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  donutValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendDotRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  legendLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  legendMetaText: {
    color: colors.muted,
    flexShrink: 0,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    textAlign: "right",
  },
  legendName: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  legendText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  metricCard: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 10,
    padding: 12,
  },
  metricHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  metricLabel: {
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  metricValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 19,
  },
  paymentChartWrap: {
    alignItems: "center",
    gap: 14,
  },
  paymentLegend: {
    alignSelf: "stretch",
    gap: 9,
  },
  paymentLegendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  rangeButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 8,
  },
  rangeButtonActive: {
    backgroundColor: colors.foreground,
  },
  rangeTabs: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  rangeText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  rangeTextActive: {
    color: colors.secondary,
  },
  salesTrendHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  salesTrendPill: {
    backgroundColor: chartTokens.primaryTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  salesTrendSection: {
    gap: 12,
    paddingVertical: 8,
  },
  salesTrendTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
  },
  victoryChart: {
    alignSelf: "center",
    overflow: "hidden",
    position: "relative",
  },
  victoryFrame: {
    alignSelf: "stretch",
    gap: 12,
    overflow: "visible",
  },
  victoryLegendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  victoryLegendMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  victoryLegendValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
});
