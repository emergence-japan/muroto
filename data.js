/* ==========================================================================
   室戸ポータル — chart data
   All figures are from published primary sources; each dataset carries
   its source label so charts and table views can cite it.
   ========================================================================== */

const MUROTO_DATA = Object.freeze({
  asOf: "2026-07-03",

  /* 高知県推計人口(各年10月1日、2026のみ6月1日)
     出典: 高知県「高知県推計人口」市町村別長期時系列 */
  population: {
    unit: "人",
    source: "高知県推計人口(県統計分析課)",
    series: [
      { year: 2010, value: 15210 },
      { year: 2011, value: 15081 },
      { year: 2012, value: 14715 },
      { year: 2013, value: 14296 },
      { year: 2014, value: 13906 },
      { year: 2015, value: 13524 },
      { year: 2016, value: 13210 },
      { year: 2017, value: 12773 },
      { year: 2018, value: 12430 },
      { year: 2019, value: 12052 },
      { year: 2020, value: 11742 },
      { year: 2021, value: 11392 },
      { year: 2022, value: 11071 },
      { year: 2023, value: 10765 },
      { year: 2024, value: 10326 },
      { year: 2025, value: 9962 },
      { year: 2026, value: 9684, note: "6月1日現在" }
    ]
  },

  /* 年齢3区分(令和8年6月1日現在) 出典: 高知県推計人口 */
  age: {
    rowLabel: "室戸市(2026年6月)",
    unit: "%",
    source: "高知県推計人口(令和8年6月1日現在)",
    segments: [
      { label: "15歳未満", pct: 5.5, people: 537 },
      { label: "15〜64歳", pct: 39.3, people: 3805 },
      { label: "65歳以上", pct: 55.2, people: 5342 }
    ]
  },

  /* 産業別就業者構成(2020年国勢調査) */
  industry: {
    unit: "%",
    source: "2020年国勢調査(総務省統計局)",
    legend: ["第1次産業", "第2次産業", "第3次産業"],
    rows: [
      { label: "室戸市", segments: [21.3, 17.0, 61.5] },
      { label: "全国", segments: [3.5, 23.7, 72.8] }
    ]
  },

  /* ふるさと納税 寄附受入額(億円) 出典: 総務省 現況調査 */
  furusato: {
    unit: "億円",
    source: "総務省 ふるさと納税に関する現況調査",
    series: [
      { year: "2020年度", value: 15.46 },
      { year: "2021年度", value: 18.96 },
      { year: "2022年度", value: 16.09 },
      { year: "2023年度", value: 19.39 },
      { year: "2024年度", value: 16.59 }
    ]
  },

  /* 令和8年度一般会計当初予算 歳入(億円)
     出典: 広報むろと2026年6月号 */
  revenue: {
    unit: "億円",
    source: "広報むろと2026年6月号(令和8年度当初予算)",
    total: 198.6,
    rows: [
      { label: "地方交付税", value: 50.6, pct: 25.5 },
      { label: "国庫支出金", value: 28.5, pct: 14.3 },
      { label: "市債", value: 28.3, pct: 14.2 },
      { label: "県支出金", value: 11.9, pct: 6.0 },
      { label: "市税", value: 10.2, pct: 5.1 },
      { label: "その他", value: 69.2, pct: 34.9, other: true }
    ]
  },

  /* 自主財源/依存財源 */
  fundingMix: {
    source: "広報むろと2026年6月号",
    segments: [
      { label: "自主財源", pct: 37.4 },
      { label: "依存財源", pct: 62.6 }
    ]
  },

  /* 歳出(目的別・億円) 出典: 広報むろと2026年6月号 */
  expenditure: {
    unit: "億円",
    source: "広報むろと2026年6月号(令和8年度当初予算)",
    rows: [
      { label: "総務費", value: 59.1, pct: 29.7 },
      { label: "民生費", value: 43.6, pct: 22.0 },
      { label: "教育費", value: 17.9, pct: 9.0 },
      { label: "公債費", value: 16.1, pct: 8.1 },
      { label: "消防費", value: 14.5, pct: 7.3 },
      { label: "土木費", value: 13.7, pct: 6.9 },
      { label: "衛生費", value: 12.2, pct: 6.2 },
      { label: "農林水産業費", value: 11.6, pct: 5.8 },
      { label: "商工費", value: 8.2, pct: 4.1 },
      { label: "議会費ほか", value: 1.6, pct: 0.9, other: true }
    ]
  }
});
