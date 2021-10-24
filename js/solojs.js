(() => {
  // <stdin>
  var options = {
    chart: {
      height: 180,
      type: "radialBar"
    },
    series: [70],
    colors: ["#12C7A9"],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: "#212529"
        },
        track: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: "#12C7A9",
            fontSize: "20px"
          },
          value: {
            color: "#fff",
            fontSize: "18px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#12C7A9"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["Python 3"]
  };
  var chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
  var options = {
    chart: {
      height: 180,
      type: "radialBar"
    },
    series: [65],
    colors: ["#12C7A9"],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: "#212529"
        },
        track: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: "#12C7A9",
            fontSize: "20px"
          },
          value: {
            color: "#fff",
            fontSize: "18px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#12C7A9"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["Bash"]
  };
  var chart = new ApexCharts(document.querySelector("#chart2"), options);
  chart.render();
  var options = {
    chart: {
      height: 180,
      type: "radialBar"
    },
    series: [20],
    colors: ["#12C7A9"],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: "#212529"
        },
        track: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: "#12C7A9",
            fontSize: "20px"
          },
          value: {
            color: "#fff",
            fontSize: "18px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#12C7A9"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["JS"]
  };
  var chart = new ApexCharts(document.querySelector("#chart3"), options);
  chart.render();
  var options = {
    chart: {
      height: 180,
      type: "radialBar"
    },
    series: [67],
    colors: ["#12C7A9"],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: "#212529"
        },
        track: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: "#12C7A9",
            fontSize: "20px"
          },
          value: {
            color: "#fff",
            fontSize: "18px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#12C7A9"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["Html"]
  };
  var chart = new ApexCharts(document.querySelector("#chart4"), options);
  chart.render();
  var options = {
    chart: {
      height: 180,
      type: "radialBar"
    },
    series: [67],
    colors: ["#12C7A9"],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: "#212529"
        },
        track: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: "#12C7A9",
            fontSize: "20px"
          },
          value: {
            color: "#fff",
            fontSize: "18px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: ["#12C7A9"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["css"]
  };
  var chart = new ApexCharts(document.querySelector("#chart5"), options);
  chart.render();
  var options = {
    fill: {
      colors: void 0,
      opacity: 0.9,
      type: "solid",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: void 0,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
        colorStops: ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"]
      }
    },
    chart: {
      height: "70%",
      width: "100%",
      type: "radar"
    },
    series: [
      {
        name: "Vulnerability",
        data: [45, 52, 38, 24, 33, 10]
      }
    ],
    labels: ["April", "May", "June", "July", "August", "September"]
  };
  var chart = new ApexCharts(document.querySelector("#chart_hackthebox"), options);
  chart.render();
  var options = {
    fill: {
      colors: void 0,
      opacity: 0.9,
      type: "solid",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: void 0,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
        colorStops: ["#2E93fA", "#66DA26", "#546E7A", "#E91E63", "#FF9800"]
      }
    },
    chart: {
      height: "70%",
      width: "100%",
      type: "radar"
    },
    series: [
      {
        name: "My Reports",
        data: [45, 52, 38, 24, 33, 10, 40]
      },
      {
        name: "Accepted reports",
        data: [26, 21, 20, 6, 8, 15, 40]
      }
    ],
    labels: ["XSS", "SSRF", "SSTI", "IDor", "SQl", "CVE", "ErrorLogs"]
  };
  var chart = new ApexCharts(document.querySelector("#chart_hackerone"), options);
  chart.render();
})();
