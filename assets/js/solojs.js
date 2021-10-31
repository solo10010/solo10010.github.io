var options = {
    chart: {
      height: 180,
      type: "radialBar",
    },
  
    series: [70],
    colors: ["#1ab7ea"],
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
            color: "#1ab7ea",
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
        color: ["#1ab7ea"],
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: ["Python"]
  };
  
  var chart = new ApexCharts(document.querySelector("#chart"), options);
  
  
  chart.render();

  var options = {
    chart: {
      height: 180,
      type: "radialBar",
    },
  
    series: [65],
    colors: ["#0084ff"],
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
            color: "#0084ff",
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
        gradientToColors: ["#0084ff"],
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
      type: "radialBar",
    },
  
    series: [20],
    colors: ["#39539E"],
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
            color: "#39539E",
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
        gradientToColors: ["#39539E"],
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
      type: "radialBar",
    },
  
    series: [67],
    colors: ["#0077B5"],
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
            color: "#0077B5",
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
        gradientToColors: ["#0077B5"],
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
      type: "radialBar",
    },
  
    series: [67],
    colors: ["#001df7"],
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
            color: "#001df7",
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
        gradientToColors: ["#001df7"],
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

    series: [20, 65, 10, 20,20],
    chart: {
    height: 390,
    type: 'radialBar',
  },
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 270,
      hollow: {
        margin: 5,
        size: '30%',
        background: 'transparent',
        image: undefined,
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          show: false,
        }
      }
    }
  },
  colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5', '#001df7'],
  labels: [' % Python', ' % Bash', ' % JS', ' % Html', " % CSS"],
  legend: {
    show: true,
    floating: true,
    fontSize: '16px',
    position: 'left',
    offsetX: 160,
    offsetY: 15,
    labels: {
      useSeriesColors: true,
    },
    markers: {
      size: 0
    },
    formatter: function(seriesName, opts) {
      return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex]
    },
    itemMargin: {
      vertical: 3
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      legend: {
          show: false
      }
    }
  }]
  };

  var chart = new ApexCharts(document.querySelector("#chart_total_code"), options);
  chart.render();



  var options = {
    tooltip: {
      theme: 'dark',
   },
    fill: {
      colors: undefined,
      opacity: 0.9,
      type: 'solid',
      gradient: {
          shade: 'dark',
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: ['#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800'],
      }
    },
    chart: {
      height: '440em',
      width: '100%',
      type: "radar"
  },
    series: [
      {
        name: "Vulnerability",
        data: [33.3, 9, 17, 39]
      },
    ],
    labels: ['IDOR', 'WEB', 'NETWORK', 'SUID']
  }
  
  var chart = new ApexCharts(document.querySelector("#chart_hackthebox"), options);
  
  chart.render();

  var options = {
    tooltip: {
      theme: 'dark',
   },
    fill: {
      colors: undefined,
      
      opacity: 0.9,
      type: 'solid',
      gradient: {
          shade: 'dark',
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: ['#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800'],
      }
    },
    
    chart: {
      
      height: '440em',
      width: '100%',
      type: "radar"
  },
  series: [
    {
      name: "My Reports",
      data: [0, 0, 0, 0, 0, 0, 0]
      
    }
  ],
    labels: ['XSS', 'SSRF', 'SSTI', 'IDor', 'SQl', 'CVE', 'ErrorLogs']
  }
  
  var chart = new ApexCharts(document.querySelector("#chart_hackerone"), options);
  
  chart.render();



  var options = {

    tooltip: {
      theme: 'dark',
   },
    fill: {
      colors: undefined,
      opacity: 0.9,
      type: 'solid'
    },


    chart: {
      
      height: '440em',
      width: '100%',
      type: "radar"
  },
  series: [
    {
      
      name: "My Reports",
      data: [9, 0, 0, 0, 0, 0, 9, 0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      
    }
  ],
    labels: ['XSS', 'SQL', 'CSRF', 'Clickjacking', 'DOM-based', 'CORS', 'HTTP request smuggling', 'XXE', 'SSRF', 'Command Inject', 'SSTI', 'Dir Traversal', 'Access control vulnerabilities', 'Authentication', 'WebSockets', 'Web cache poisoning', 'Insecure deserialization', 'Information disclosure', 'Business logic', 'HTTP Host header attacks', 'OAuth']
  }
  
  var chart = new ApexCharts(document.querySelector("#chart_portswinger"), options);
  
  chart.render();

  var options = {
    tooltip: {
      theme: 'dark',
   },
    fill: {
      colors: undefined,
      opacity: 0.9,
      type: 'solid',
      gradient: {
          shade: 'dark',
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: ['#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800'],
      }
    },
    
    chart: {
      
      height: '440em',
      width: '100%',
      type: "radar"
  },
  series: [
    {
      name: "My Reports",
      data: [0, 0, 0, 0, 0, 0, 0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      
    }
  ],
    labels: ['XSS', 'SQL', 'CSRF', 'Clickjacking', 'DOM-based', 'CORS', 'HTTP request smuggling', 'XXE', 'SSRF', 'Command Inject', 'SSTI', 'Dir Traversal', 'Access control vulnerabilities', 'Authentication', 'WebSockets', 'Web cache poisoning', 'Insecure deserialization', 'Information disclosure', 'Business logic', 'HTTP Host header attacks', 'OAuth']
  }
  
  var chart = new ApexCharts(document.querySelector("#chart_rootme"), options);
  
  chart.render();