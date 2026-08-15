import { Project, Layout, Plot, Road, PlotStatusHistory, PolygonPoint, FacingDirection } from '@/types';

export const DEMO_PROJECT_ID = 'demo-project-green-valley';
export const DEMO_LAYOUT_ID = 'demo-layout-green-valley-v1';

export const BASIC_DEMO_PROJECT_ID = 'demo-project-basic-20ft';
export const BASIC_DEMO_LAYOUT_ID = 'demo-layout-basic-20ft-v1';

// --- PROJECT 1: Green Valley Estates (69 Plots) ---
export const DEMO_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  name: 'Green Valley Estates',
  location: 'Main Highway Sector 42, Tech Valley',
  description: 'Premium residential community featuring 69 approved plots, wide 40ft & 30ft roads, landscaped parks, and underground utilities.',
  created_by: 'Green Valley Developers',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  layout_count: 1,
  total_plots: 69,
  available_plots: 38,
  booked_plots: 18,
  sold_plots: 13,
  total_value: 248500000,
};

export const DEMO_LAYOUT: Layout = {
  id: DEMO_LAYOUT_ID,
  project_id: DEMO_PROJECT_ID,
  file_url: '/site-grid-48-blueprint.svg',
  file_type: 'image/svg+xml',
  original_width: 1200,
  original_height: 964,
  processing_status: 'completed',
  ai_model: 'Vision-OCR SiteMap Engine v3.2',
  created_at: new Date(Date.now() - 29 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

// --- PROJECT 2: 20ft Road Villa Colony (4 Plots Sketch Blueprint) ---
export const BASIC_DEMO_PROJECT: Project = {
  id: BASIC_DEMO_PROJECT_ID,
  name: '20ft Road Villa Colony (4 Plots)',
  location: 'Sector 14, Palm Boulevard',
  description: 'Custom blueprint drawing featuring 4 premium villa plots (6.26 cents / 6.22 cents) surrounded by four 20ft access roads.',
  created_by: 'Architectural CAD Engine',
  created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  layout_count: 1,
  total_plots: 4,
  available_plots: 2,
  booked_plots: 1,
  sold_plots: 1,
  total_value: 13560000,
};

export const BASIC_DEMO_LAYOUT: Layout = {
  id: BASIC_DEMO_LAYOUT_ID,
  project_id: BASIC_DEMO_PROJECT_ID,
  file_url: '/basic-blueprint-layout.png',
  file_type: 'image/png',
  original_width: 768,
  original_height: 1024,
  processing_status: 'completed',
  ai_model: 'Vision-OCR Blueprint Road Detector v1.0',
  created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const BASIC_DEMO_PLOTS: Plot[] = [
  {
    id: 'plot-basic-01',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    plot_number: 'P-01',
    dimensions_text: '65\' 0" × 42\' 0"',
    area_cents: 6.26,
    area: 2730, // 65' x 42' = 6.26 cents
    price: 3400000,
    facing: 'North-West',
    status: 'available',
    polygon_coordinates: [
      [95, 115],
      [385, 115],
      [385, 525],
      [95, 525],
    ],
    ai_confidence: 0.98,
    ai_detected: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plot-basic-02',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    plot_number: 'P-02',
    dimensions_text: '65\' 0" × 41\' 9"',
    area_cents: 6.22,
    area: 2714, // 65' x 41.75' = 6.22 cents
    price: 3380000,
    facing: 'North-East',
    status: 'booked',
    customer_name: 'Dr. Vikram Mehta',
    customer_phone: '+91 98765 43210',
    booking_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    polygon_coordinates: [
      [385, 115],
      [675, 115],
      [675, 525],
      [385, 525],
    ],
    ai_confidence: 0.96,
    ai_detected: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plot-basic-03',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    plot_number: 'P-03',
    dimensions_text: '65\' 0" × 42\' 0"',
    area_cents: 6.26,
    area: 2730, // 65' x 42' = 6.26 cents
    price: 3400000,
    facing: 'South-West',
    status: 'available',
    polygon_coordinates: [
      [95, 525],
      [385, 525],
      [385, 940],
      [95, 940],
    ],
    ai_confidence: 0.97,
    ai_detected: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plot-basic-04',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    plot_number: 'P-04',
    dimensions_text: '65\' 0" × 41\' 9"',
    area_cents: 6.22,
    area: 2714, // 65' x 41.75' = 6.22 cents
    price: 3380000,
    facing: 'South-East',
    status: 'sold',
    customer_name: 'Mr. Rajesh Sharma',
    customer_phone: '+91 98123 45678',
    booking_date: new Date(Date.now() - 15 * 86400000).toISOString(),
    polygon_coordinates: [
      [385, 525],
      [675, 525],
      [675, 940],
      [385, 940],
    ],
    ai_confidence: 0.99,
    ai_detected: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const BASIC_DEMO_ROADS: Road[] = [
  {
    id: 'road-basic-top',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    name: '20 ft Road (North)',
    polygon_coordinates: [
      [95, 20],
      [675, 20],
      [675, 90],
      [95, 90],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-basic-left',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    name: '20 ft Road (West)',
    polygon_coordinates: [
      [15, 115],
      [85, 115],
      [85, 940],
      [15, 940],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-basic-right',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    name: '20 ft Road (East)',
    polygon_coordinates: [
      [685, 115],
      [755, 115],
      [755, 940],
      [685, 940],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-basic-bottom',
    layout_id: BASIC_DEMO_LAYOUT_ID,
    name: '20 ft Road (South)',
    polygon_coordinates: [
      [95, 950],
      [675, 950],
      [675, 1010],
      [95, 1010],
    ],
    created_at: new Date().toISOString(),
  },
];

// Precise polygon mapping for all 69 plots in Green Valley Estates layout blueprint
function generateGreenValleyPlots(): Plot[] {
  const plots: Plot[] = [];

  const getStatus = (num: number): 'available' | 'booked' | 'sold' => {
    if (num % 5 === 0) return 'sold';
    if (num % 3 === 0) return 'booked';
    return 'available';
  };

  // 1. TOP ROW: Plots 01 to 10
  const topStartX = 360;
  const topW = 36;
  for (let i = 1; i <= 10; i++) {
    const x1 = topStartX + (i - 1) * topW;
    const x2 = x1 + topW - 2;
    const y1 = 86;
    const y2 = 148;
    const numStr = String(i).padStart(2, '0');

    plots.push({
      id: `plot-gv-${numStr}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: numStr,
      area: 1200,
      price: 2400000,
      facing: 'North',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: i === 7 ? 0.78 : 0.96,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 2. MIDDLE TOP ROW: Plots 11 to 20
  for (let i = 11; i <= 20; i++) {
    const idx = i - 11;
    const x1 = topStartX + idx * topW;
    const x2 = x1 + topW - 2;
    const y1 = 172;
    const y2 = 234;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 1200,
      price: 2400000,
      facing: 'North',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.95,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 3. MIDDLE BOTTOM ROW: Plots 21 to 30
  for (let i = 21; i <= 30; i++) {
    const idx = i - 21;
    const x1 = topStartX + idx * topW;
    const x2 = x1 + topW - 2;
    const y1 = 236;
    const y2 = 298;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 1800,
      price: 3600000,
      facing: 'South',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.94,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 4. LEFT ANGLED SECTION: Plots 31 to 36
  const angledPlots = [
    { num: '31', poly: [[255, 220], [325, 178], [330, 260], [225, 290]] },
    { num: '32', poly: [[225, 292], [330, 262], [315, 335], [200, 355]] },
    { num: '33', poly: [[200, 357], [315, 337], [290, 410], [175, 425]] },
    { num: '34', poly: [[175, 427], [290, 412], [260, 475], [145, 485]] },
    { num: '35', poly: [[145, 487], [260, 477], [225, 545], [115, 548]] },
    { num: '36', poly: [[115, 550], [225, 547], [195, 600], [80, 595]] },
  ];

  angledPlots.forEach((ap) => {
    plots.push({
      id: `plot-gv-${ap.num}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: ap.num,
      area: 2400,
      price: 4800000,
      facing: 'West',
      status: getStatus(Number(ap.num)),
      polygon_coordinates: ap.poly as PolygonPoint[],
      ai_confidence: 0.92,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  // 5. CENTER TOP BLOCK: Plots 37 to 44
  const cTopX = 370;
  const cTopW = 38;
  for (let i = 37; i <= 44; i++) {
    const idx = i - 37;
    const x1 = cTopX + idx * cTopW;
    const x2 = x1 + cTopW - 2;
    const y1 = 325;
    const y2 = 385;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 1500,
      price: 3300000,
      facing: 'North',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.96,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 6. CENTER BOTTOM BLOCK: Plots 45 to 53
  const cBotX = 370;
  const cBotW = 34;
  for (let i = 45; i <= 53; i++) {
    const idx = 53 - i;
    const x1 = cBotX + idx * cBotW;
    const x2 = x1 + cBotW - 2;
    const y1 = 387;
    const y2 = 448;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 1500,
      price: 3300000,
      facing: 'South',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.95,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 7. BOTTOM ODD-SIZE ROW: Plots 54 to 63
  const botX = 230;
  const botW = 46;
  for (let i = 54; i <= 63; i++) {
    const idx = i - 54;
    const x1 = botX + idx * botW;
    const x2 = x1 + botW - 2;
    const y1 = 482;
    const y2 = 560;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 1650,
      price: 3630000,
      facing: 'South',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.91,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 8. RIGHT VERTICAL COLUMN: Plots 64 to 70
  const rY = 300;
  const rH = 38;
  for (let i = 64; i <= 70; i++) {
    const idx = i - 64;
    const x1 = 705;
    const x2 = 785;
    const y1 = rY + idx * rH;
    const y2 = y1 + rH - 2;

    plots.push({
      id: `plot-gv-${i}`,
      layout_id: DEMO_LAYOUT_ID,
      plot_number: String(i),
      area: 2400,
      price: 5200000,
      facing: 'East',
      status: getStatus(i),
      polygon_coordinates: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      ai_confidence: 0.97,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return plots;
}

export const DEMO_PLOTS: Plot[] = generateGreenValleyPlots();

export const DEMO_ROADS: Road[] = [
  {
    id: 'road-existing-main',
    layout_id: DEMO_LAYOUT_ID,
    name: 'Existing Main Road (210.40 M)',
    polygon_coordinates: [
      [60, 565],
      [810, 565],
      [810, 610],
      [60, 610],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-40ft-wide',
    layout_id: DEMO_LAYOUT_ID,
    name: '40 Feet Wide Road',
    polygon_coordinates: [
      [225, 450],
      [695, 450],
      [695, 480],
      [225, 480],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-30ft-mid',
    layout_id: DEMO_LAYOUT_ID,
    name: '30 Feet Wide Road',
    polygon_coordinates: [
      [360, 300],
      [700, 300],
      [700, 322],
      [360, 322],
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'road-30ft-top',
    layout_id: DEMO_LAYOUT_ID,
    name: '30 Feet Wide Road',
    polygon_coordinates: [
      [360, 150],
      [720, 150],
      [720, 170],
      [360, 170],
    ],
    created_at: new Date().toISOString(),
  },
];

export const DEMO_PLOT_HISTORY: PlotStatusHistory[] = [
  {
    id: 'hist-1',
    plot_id: 'plot-gv-27',
    old_status: 'available',
    new_status: 'booked',
    changed_by: 'Alex Morgan (Sales Director)',
    changed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: 'Token advance received from Mr. Rajesh Sharma for Plot 27.',
  },
  {
    id: 'hist-2',
    plot_id: 'plot-gv-27',
    old_status: 'booked',
    new_status: 'available',
    changed_by: 'System Admin',
    changed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'Booking released due to customer request.',
  },
  {
    id: 'hist-3',
    plot_id: 'plot-gv-27',
    old_status: 'available',
    new_status: 'booked',
    changed_by: 'Sarah Jenkins (Property Manager)',
    changed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Re-booked by Dr. Vikram Mehta.',
  },
];
