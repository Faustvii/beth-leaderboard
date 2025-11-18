const colors = [
    '#D00010', '#FEC641', '#7D0006', '#2F8A27', '#FE0016', 
    '#5C6C94', '#6B0D05', '#63C13B', '#DB1913', '#FEE34A' 
];

export const BokehLightsHtml = () => {
  const lightsCount = 150;
  
//   const colors = [
//     '#FCF1BD',
//   ];
//   const colors = [
//     '#F4A43B', '#0AB1AA', '#FDFEE4', '#F42618', '#ADFEDD', 
//     '#FF5F24', '#FEF14F', '#FD361B', '#30398D', '#FEE086'
//   ];

  // Generate styles for each light
  const generateLightStyles = () => {
    return Array.from({ length: lightsCount }).map((_, i) => {
      const lightWidth = 75 + Math.random() * 25;
      const lightVertical = 8 + Math.random() * 92;
      const lightHorizontal = Math.random() * 100;
      const lightBlur = 2 + Math.random() * 2;
      const lightDelay = 10 + Math.random() * 25;
      const bgColor = colors[Math.floor(Math.random() * colors.length)];
      const animation = 1 + Math.floor(Math.random() * 5);
      
      return `
        .light:nth-child(${i + 1}) {
          width: ${lightWidth}px;
          height: ${lightWidth}px;
          top: ${lightVertical}%;
          left: ${lightHorizontal}%;
          background: ${bgColor};
          filter: blur(${lightBlur}px);
          animation: ${lightDelay}s light${animation} linear infinite;
        }
      `;
    }).join('');
  };

  return (
    <>
      <style>
        {`
        .bokeh {
          position: fixed;
          width: 100%;
          height: 100%;
          pointer-events: none;
          top: 0;
          left: 0;
          z-index: 0;
        }
        
        .light {
          position: absolute;
          border-radius: 50%;
          opacity: 0;
        }
        
        ${generateLightStyles()}
        
        @keyframes light1 {
          25% { opacity: 0.5; }
          50% { opacity: 0; }
          75% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes light2 {
          25% { opacity: 0.6; }
          50% { opacity: 0; }
          75% { opacity: 0.4; }
          100% { opacity: 0; }
        }
        @keyframes light3 {
          25% { opacity: 0.3; }
          50% { opacity: 0; }
          75% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes light4 {
          25% { opacity: 0.7; }
          50% { opacity: 0; }
          75% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        @keyframes light5 {
          25% { opacity: 0.4; }
          50% { opacity: 0; }
          75% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        `}
      </style>
      
      <div class="bokeh">
        {Array.from({ length: lightsCount }).map(() => (
          <div class="light"></div>
        ))}
      </div>
    </>
  );
};

export const SideLightsHtml = () => {
  const lightCount = 60;
  
  // Variables matching the original CodePen
  const globeWidth = 12;
  const globeHeight = 28;
  const globeSpacing = 30;
  const globeSpread = 10;
  const lightOffOpacity = 0.4;
  
  return (
    <>
      <style>
        {`
          .lightrope-left, .lightrope-right {
            white-space: nowrap;
            overflow: visible;
            position: fixed;
            z-index: 1;
            margin: 0;
            padding: 0 30px;
            pointer-events: none;
            height: 100%;
            top: 0;
          }
          
          .lightrope-left {
            left: -30px;
            writing-mode: vertical-lr;
            transform: rotate(180deg);
          }
          
          .lightrope-right {
            right: -30px;
            writing-mode: vertical-lr;
            transform: rotate(180deg);
          }
          
          .lightrope-left li, .lightrope-right li {
            position: relative;
            animation-fill-mode: both;
            animation-iteration-count: infinite;
            list-style: none;
            margin: 0;
            padding: 0;
            display: block;
            width: ${globeWidth}px;
            height: ${globeHeight}px;
            border-radius: 50%;
            margin: ${globeSpacing / 2}px;
            display: inline-block;
            animation-duration: 2s;
          }

          .lightrope-left li {
            transform: rotate(90deg);
          }
          
          .lightrope-right li {
            transform: rotate(-90deg);
          }

          ${colors.map((color, index) => `
            .lightrope-left li:nth-child(${colors.length}n+${index + 1}),
            .lightrope-right li:nth-child(${colors.length}n+${index + 1}) {
              background: ${color};
              box-shadow: ${globeHeight / 6}px 0px ${globeWidth * 2}px ${globeSpread}px ${color};
              animation-name: flash-${index + 1};
              animation-duration: ${1 + (index % 3) * 0.3}s;
            }
            
            @keyframes flash-${index + 1} {
              0%, 100% {
                background: ${color};
                box-shadow: ${globeHeight / 6}px 0px ${globeWidth * 2}px ${globeSpread}px ${color};
              }
              50% {
                background: ${color}${Math.round(lightOffOpacity * 255).toString(16).padStart(2, '0')};
                box-shadow: ${globeHeight / 6}px 0px ${globeWidth * 2}px ${globeSpread}px ${color}33;
              }
            }
          `).join('')}
          
          .lightrope-left li:before, .lightrope-right li:before {
            content: "";
            position: absolute;
            background: #222;
            width: ${globeWidth - 2}px;
            height: ${globeHeight / 3}px;
            border-radius: 3px;
            top: ${0 - globeHeight / 6}px;
            left: 1px;
          }
          
          .lightrope-left li:after, .lightrope-right li:after {
            content: "";
            top: ${0 - globeHeight / 2}px;
            left: ${globeWidth - 3}px;
            position: absolute;
            width: ${globeSpacing + 12}px;
            height: ${(globeHeight / 3) * 2}px;
            border-bottom: solid #222 2px;
            border-radius: 50%;
          }
          
          .lightrope-left li:last-child:after, .lightrope-right li:last-child:after {
            content: none;
          }
          
          .lightrope-left li:first-child, .lightrope-right li:first-child {
            margin-top: ${-globeSpacing}px;
          }
          

        `}
      </style>
      
      <ul class="lightrope-left">
        {Array.from({ length: lightCount }).map((_, i) => (
          <li></li>
        ))}
      </ul>
      
      <ul class="lightrope-right">
        {Array.from({ length: lightCount }).map((_, i) => (
          <li></li>
        ))}
      </ul>
    </>
  );
};