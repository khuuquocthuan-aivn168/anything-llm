import { v4 } from "uuid";
import {
  AreaChart,
  BarChart,
  DonutChart,
  Legend,
  LineChart,
} from "@tremor/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Funnel,
  FunnelChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { Colors, getTremorColor } from "./chart-utils.js";
import CustomCell from "./CustomCell.jsx";
import Tooltip from "./CustomTooltip.jsx";
import { safeJsonParse } from "@/utils/request.js";
import renderMarkdown from "@/utils/chat/markdown.js";
import DOMPurify from "dompurify";
import { memo, useCallback, useState } from "react";
import { saveAs } from "file-saver";
import { useGenerateImage } from "recharts-to-png";
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";

const dataFormatter = (number) => {
  return Intl.NumberFormat("us").format(number).toString();
};

export function Chartable({ props }) {
  const [getDivJpeg, { ref }] = useGenerateImage({
    quality: 1,
    type: "image/jpeg",
    options: {
      backgroundColor: "#393d43",
      padding: 20,
    },
  });
  const handleDownload = useCallback(async () => {
    const jpeg = await getDivJpeg();
    if (jpeg) saveAs(jpeg, `chart-${v4().split("-")[0]}.jpg`);
  }, []);

  const color = null;
  const showLegend = true;
  const content =
    typeof props.content === "string"
      ? safeJsonParse(props.content, null)
      : props.content;
  if (content === null) return null;

  // Support both single chart (old format) and multi chart (new format)
  const charts = Array.isArray(content.charts)
    ? content.charts
    : [
        {
          type: content.type,
          dataset: content.dataset,
          title: content.title,
        },
      ];

  const colorKeys = Object.keys(Colors);

  const renderSingleChart = (chart, index) => {
    const chartType = chart?.type?.toLowerCase();
    const data =
      typeof chart.dataset === "string"
        ? safeJsonParse(chart.dataset, [])
        : chart.dataset;

    if (!Array.isArray(data) || data.length === 0) return null;

    // Detect all value columns (everything except "name" and "value" unless "value" is the only key)
    const keys = Object.keys(data[0]);
    const categories = keys.filter((k) => k !== "name" && k !== "value");
    
    // Backwards compatibility for single metrics utilizing the 'value' key
    if (keys.includes("value") && categories.length === 0) {
      categories.push("value");
    } else if (keys.includes("value")) {
      categories.push("value");
    }

    if (categories.length === 0) categories.push("value");

    const title = chart.title;
    const chartColors = colorKeys.slice(0, categories.length);

    switch (chartType) {
      case "area":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            <AreaChart
              className="h-[350px]"
              data={data}
              index="name"
              categories={categories}
              colors={chartColors}
              showLegend={showLegend}
              valueFormatter={dataFormatter}
            />
          </div>
        );
      case "bar":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            <BarChart
              className="h-[350px]"
              data={data}
              index="name"
              categories={categories}
              colors={chartColors}
              showLegend={showLegend}
              valueFormatter={dataFormatter}
              yAxisWidth={80}
            />
          </div>
        );
      case "line":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 pb-12 rounded-xl text-white h-[450px] w-full light:border light:border-theme-border-primary">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            <LineChart
              className="h-[350px]"
              data={data}
              index="name"
              categories={categories}
              colors={chartColors}
              showLegend={showLegend}
              valueFormatter={dataFormatter}
            />
          </div>
        );
      case "composed":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            {showLegend && (
              <Legend
                categories={categories}
                colors={chartColors}
                className="mb-5 justify-end"
              />
            )}
            <div className="w-full h-[260px] overflow-hidden flex justify-center">
              <ComposedChart width={500} height={260} data={data}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ transform: "translate(0, 6)", fill: "white" }}
                  style={{ fontSize: "12px", fontFamily: "Inter; Helvetica" }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  tick={{ transform: "translate(-3, 0)", fill: "white" }}
                  style={{ fontSize: "12px", fontFamily: "Inter; Helvetica" }}
                />
                <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
                {categories.map((cat, idx) => (
                  idx % 2 === 0 ? (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      name={cat}
                      fill={getTremorColor(chartColors[idx % chartColors.length])}
                    />
                  ) : (
                    <Line
                      key={cat}
                      type="linear"
                      dataKey={cat}
                      stroke={getTremorColor(chartColors[idx % chartColors.length])}
                      dot={false}
                      strokeWidth={2}
                    />
                  )
                ))}
              </ComposedChart>
            </div>
          </div>
        );
      case "scatter":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            {showLegend && (
              <div className="flex justify-end">
                <Legend
                  categories={categories}
                  colors={chartColors}
                  className="mb-5"
                />
              </div>
            )}
            <div className="w-full h-[260px] overflow-hidden flex justify-center">
              <ScatterChart width={500} height={260} data={data}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ transform: "translate(0, 6)", fill: "white" }}
                  style={{ fontSize: "12px", fontFamily: "Inter; Helvetica" }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  type="number"
                  tick={{ transform: "translate(-3, 0)", fill: "white" }}
                  style={{ fontSize: "12px", fontFamily: "Inter; Helvetica" }}
                />
                <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
                {categories.map((cat, idx) => (
                  <Scatter key={cat} name={cat} dataKey={cat} fill={getTremorColor(chartColors[idx % chartColors.length])} />
                ))}
              </ScatterChart>
            </div>
          </div>
        );
      case "pie":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            <DonutChart
              data={data}
              category={categories[0]}
              index="name"
              colors={colorKeys}
              showLabel={showLegend}
              valueFormatter={dataFormatter}
              customTooltip={customTooltip}
            />
          </div>
        );
      case "radar":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full flex flex-col items-center">
            <h3 className="text-lg text-theme-text-primary font-medium self-start mb-4">
              {title}
            </h3>
            {showLegend && (
              <div className="flex justify-end w-full">
                <Legend
                  categories={categories}
                  colors={chartColors}
                  className="mb-5"
                />
              </div>
            )}
            <RadarChart cx={150} cy={130} outerRadius={80} width={300} height={260} data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fill: "white", fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} />
              <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
              {categories.map((cat, idx) => (
                <Radar
                  key={cat}
                  name={cat}
                  dataKey={cat}
                  stroke={getTremorColor(chartColors[idx % chartColors.length])}
                  fill={getTremorColor(chartColors[idx % chartColors.length])}
                  fillOpacity={0.6}
                />
              ))}
            </RadarChart>
          </div>
        );
      case "radialbar":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            {showLegend && (
              <div className="flex justify-end">
                <Legend
                  categories={categories}
                  colors={chartColors}
                  className="mb-5"
                />
              </div>
            )}
            <div className="w-full h-[300px] overflow-hidden flex justify-center">
              <RadialBarChart
                width={500}
                height={300}
                cx={150}
                cy={150}
                innerRadius={20}
                outerRadius={140}
                barSize={10}
                data={data}
              >
                {categories.map((cat, idx) => (
                  <RadialBar
                    key={cat}
                    angleAxisId={15}
                    label={{
                      position: "insideStart",
                      fill: getTremorColor(chartColors[idx % chartColors.length]),
                    }}
                    dataKey={cat}
                  />
                ))}
                <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
              </RadialBarChart>
            </div>
          </div>
        );
      case "treemap":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            {showLegend && (
              <div className="flex justify-end">
                <Legend
                  categories={categories}
                  colors={chartColors}
                  className="mb-5"
                />
              </div>
            )}
            <div className="w-full h-[260px] overflow-hidden flex justify-center">
              <Treemap
                width={500}
                height={260}
                data={data}
                dataKey={categories[0]}
                stroke="#fff"
                fill={getTremorColor(chartColors[0] || "blue")}
                content={<CustomCell colors={Object.values(Colors)} />}
              >
                <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
              </Treemap>
            </div>
          </div>
        );
      case "funnel":
        return (
          <div key={index} className="bg-theme-bg-primary p-8 rounded-xl text-white light:border light:border-theme-border-primary w-full">
            <h3 className="text-lg text-theme-text-primary font-medium mb-4">
              {title}
            </h3>
            {showLegend && (
              <div className="flex justify-end">
                <Legend
                  categories={categories}
                  colors={chartColors}
                  className="mb-5"
                />
              </div>
            )}
            <div className="w-full h-[300px] overflow-hidden flex justify-center">
              <FunnelChart width={500} height={300} data={data}>
                <Tooltip legendColor={getTremorColor(chartColors[0] || "blue")} />
                <Funnel dataKey={categories[0]} color={getTremorColor(chartColors[0] || "blue")} />
              </FunnelChart>
            </div>
          </div>
        );
      default:
        return <p key={index}>Unsupported chart type.</p>;
    }
  };

  const renderAllCharts = () => {
    return (
      <div className={`grid grid-cols-1 ${charts.length > 1 ? "xl:grid-cols-2" : ""} gap-6 w-full`}>
        {charts.map((chart, idx) => renderSingleChart(chart, idx))}
      </div>
    );
  };

  if (!!props.chatId) {
    return (
      <div className="flex justify-start w-full">
        <div className="py-2 px-4 w-full flex flex-col md:max-w-[80%]">
          <div className="relative w-full">
            <DownloadGraph onClick={handleDownload} />
            <div ref={ref}>{renderAllCharts()}</div>
            <span
              className="flex flex-col gap-y-1 mt-2"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(renderMarkdown(content.caption)),
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div className="py-2 px-4 w-full flex flex-col md:max-w-[80%]">
        <div className="relative w-full">
          <DownloadGraph onClick={handleDownload} />
          <div ref={ref}>{renderAllCharts()}</div>
        </div>
        <span
          className="flex flex-col gap-y-1 mt-2"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(renderMarkdown(content.caption)),
          }}
        />
      </div>
    </div>
  );
}

const customTooltip = (props) => {
  const { payload, active } = props;
  if (!active || !payload) return null;
  const categoryPayload = payload?.[0];
  if (!categoryPayload) return null;
  return (
    <div className="w-56 bg-theme-bg-primary rounded-lg border p-2 text-white">
      <div className="flex flex-1 space-x-2.5">
        <div
          className={`flex w-1.5 flex-col bg-${categoryPayload?.color}-500 rounded`}
        />
        <div className="w-full">
          <div className="flex items-center justify-between space-x-8">
            <p className="whitespace-nowrap text-right text-tremor-content">
              {categoryPayload.name}
            </p>
            <p className="whitespace-nowrap text-right font-medium text-tremor-content-emphasis">
              {categoryPayload.value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function DownloadGraph({ onClick }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    await onClick?.();
    setLoading(false);
  };

  return (
    <div className="absolute top-3 right-3 z-50 cursor-pointer">
      <div className="flex flex-col items-center">
        <div className="p-1 rounded-full border-none">
          {loading ? (
            <CircleNotch
              className="text-theme-text-primary w-5 h-5 animate-spin"
              aria-label="Downloading image..."
            />
          ) : (
            <DownloadSimple
              weight="bold"
              className="text-theme-text-primary w-5 h-5 hover:text-theme-text-primary"
              onClick={handleClick}
              aria-label="Download graph image"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Chartable);
