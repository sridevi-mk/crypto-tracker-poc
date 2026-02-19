"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, Time, LineData, IChartApi, SeriesType, SeriesOptionsMap } from "lightweight-charts";

export interface CoinChartProps {
  series: { t: number; p: number }[];
}

export function CoinChart({ series }: CoinChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.remove();
      chartInstance.current = null;
    }
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth || 400,
      height: 300,
      layout: { background: { type: ColorType.Solid, color: '#fff' }, textColor: '#222' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      rightPriceScale: { borderColor: '#ccc' },
      timeScale: { borderColor: '#ccc' },
      crosshair: { mode: 1 },
    });
    chartInstance.current = chart;
    // Workaround for type issues: use addSeries with type 'Line' and cast chart to any
    const line = (chart as any).addSeries({ type: 'Line' });
    if (line.applyOptions) line.applyOptions({ color: '#1976d2', lineWidth: 2 });
    const data: LineData<Time>[] = series.map(({ t, p }) => ({ time: t as Time, value: p }));
    line.setData(data);
    // Tooltip
    let tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = '#fff';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    chartRef.current.appendChild(tooltip);
    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time || !param.seriesData) {
        tooltip.style.display = 'none';
        return;
      }
      // param.seriesData is a Map<Series, Data> in v5
      const data = param.seriesData.get(line);
      // For line series, value; for bar/candle, use close; fallback to y
      let price: number | undefined = undefined;
      if (data && typeof data === 'object') {
        if ('value' in data) price = (data as any).value;
        else if ('close' in data) price = (data as any).close;
        else if ('y' in data) price = (data as any).y;
      }
      tooltip.style.display = 'block';
      tooltip.style.left = (param.point.x + 10) + 'px';
      tooltip.style.top = (param.point.y - 30) + 'px';
      tooltip.innerHTML =
        `<b>Price:</b> $${price?.toLocaleString(undefined, { maximumFractionDigits: 8 })}<br/>` +
        `<b>Time:</b> ${new Date((Number(param.time) || 0) * 1000).toLocaleString()}`;
    });
    return () => {
      chart.remove();
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    };
  }, [series]);

  return <div ref={chartRef} className="relative h-[300px] w-full overflow-hidden rounded-lg border border-border bg-white" />;
}
