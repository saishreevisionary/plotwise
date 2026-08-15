'use client';

import { Project, Layout, Plot, Road, PlotStatusHistory, PlotStatus, PolygonPoint } from '@/types';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';
import {
  DEMO_PROJECT,
  DEMO_LAYOUT,
  DEMO_PLOTS,
  DEMO_ROADS,
  DEMO_PLOT_HISTORY,
  BASIC_DEMO_PROJECT,
  BASIC_DEMO_LAYOUT,
  BASIC_DEMO_PLOTS,
  BASIC_DEMO_ROADS,
  DEMO_PROJECT_ID,
  DEMO_LAYOUT_ID,
  BASIC_DEMO_PROJECT_ID,
  BASIC_DEMO_LAYOUT_ID,
} from './demo-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const STORAGE_KEY = 'plotwise_ai_app_data_v2';

interface AppStoreData {
  projects: Project[];
  layouts: Layout[];
  plots: Plot[];
  roads: Road[];
  history: PlotStatusHistory[];
}

function getInitialData(): AppStoreData {
  const defaultInitial: AppStoreData = {
    projects: [BASIC_DEMO_PROJECT, DEMO_PROJECT],
    layouts: [BASIC_DEMO_LAYOUT, DEMO_LAYOUT],
    plots: [...BASIC_DEMO_PLOTS, ...DEMO_PLOTS],
    roads: [...BASIC_DEMO_ROADS, ...DEMO_ROADS],
    history: DEMO_PLOT_HISTORY,
  };

  if (typeof window === 'undefined') {
    return defaultInitial;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
      const layouts = Array.isArray(parsed.layouts) ? parsed.layouts : [];
      const plots = Array.isArray(parsed.plots) ? parsed.plots : [];
      const roads = Array.isArray(parsed.roads) ? parsed.roads : [];
      const history = Array.isArray(parsed.history) ? parsed.history : [];

      let modified = false;

      // Ensure BASIC_DEMO_PROJECT exists
      if (!projects.some((p: Project) => p.id === BASIC_DEMO_PROJECT.id)) {
        projects.unshift(BASIC_DEMO_PROJECT);
        layouts.unshift(BASIC_DEMO_LAYOUT);
        plots.unshift(...BASIC_DEMO_PLOTS);
        roads.unshift(...BASIC_DEMO_ROADS);
        modified = true;
      }

      // Ensure DEMO_PROJECT (Green Valley) exists and has clean 69-plot blueprint data
      const gvIndex = projects.findIndex((p: Project) => p.id === DEMO_PROJECT.id);
      if (gvIndex === -1) {
        projects.push(DEMO_PROJECT);
        layouts.push(DEMO_LAYOUT);
        plots.push(...DEMO_PLOTS);
        roads.push(...DEMO_ROADS);
        history.push(...DEMO_PLOT_HISTORY);
        modified = true;
      } else {
        // If Green Valley layout has corrupted 100+ contour plots, heal it back to exact 69 blueprint plots
        const gvPlotsCount = plots.filter((p: Plot) => p.layout_id === DEMO_LAYOUT_ID).length;
        if (gvPlotsCount === 0 || gvPlotsCount > 80) {
          const nonGvPlots = plots.filter((p: Plot) => p.layout_id !== DEMO_LAYOUT_ID);
          plots.length = 0;
          plots.push(...nonGvPlots, ...DEMO_PLOTS);

          const nonGvRoads = roads.filter((r: Road) => r.layout_id !== DEMO_LAYOUT_ID);
          roads.length = 0;
          roads.push(...nonGvRoads, ...DEMO_ROADS);
          modified = true;
        }
      }

      const storeData: AppStoreData = { projects, layouts, plots, roads, history };
      if (modified) {
        saveData(storeData);
      }
      return storeData;
    }
  } catch (err) {
    console.error('Failed to load local store, resetting to initial defaults:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInitial));
  } catch (e) {
    console.error('Failed to write initial store:', e);
  }

  return defaultInitial;
}

function saveData(data: AppStoreData) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }
}

export class AppState {
  private static getStore(): AppStoreData {
    return getInitialData();
  }

  /**
   * Optional background sync with Supabase PostgreSQL
   */
  public static async syncFromSupabase() {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const { data: dbProjects } = await supabase.from('projects').select('*');
      if (dbProjects && dbProjects.length > 0) {
        const store = this.getStore();
        dbProjects.forEach((dbp: any) => {
          if (!store.projects.some((p) => p.id === dbp.id)) {
            store.projects.push(dbp);
          }
        });
        saveData(store);
      }
    } catch (err) {
      console.warn('Supabase sync skipped, continuing with local store:', err);
    }
  }

  // --- PROJECTS ---
  static getProjects(): Project[] {
    try {
      const store = this.getStore();
      const validProjects = (store.projects || []).filter((p): p is Project => Boolean(p && p.id));
      const validPlots = (store.plots || []).filter((pl) => Boolean(pl && pl.id));
      const validLayouts = (store.layouts || []).filter((l) => Boolean(l && l.id));

      if (validProjects.length === 0) {
        return [BASIC_DEMO_PROJECT, DEMO_PROJECT];
      }

      return validProjects.map((p) => {
        const projectPlots = validPlots.filter((pl) => {
          const layout = validLayouts.find((l) => l.id === pl.layout_id);
          return layout?.project_id === p.id;
        });

        const available = projectPlots.filter((pl) => pl?.status === 'available').length;
        const booked = projectPlots.filter((pl) => pl?.status === 'booked').length;
        const sold = projectPlots.filter((pl) => pl?.status === 'sold').length;
        const totalVal = projectPlots.reduce((sum, pl) => sum + (pl?.price || 0), 0);

        return {
          ...p,
          total_plots: projectPlots.length || p.total_plots || 0,
          available_plots: available,
          booked_plots: booked,
          sold_plots: sold,
          total_value: totalVal || p.total_value || 0,
        };
      });
    } catch (err) {
      console.error('Error getting projects from store:', err);
      return [BASIC_DEMO_PROJECT, DEMO_PROJECT];
    }
  }

  static getProjectById(id: string): Project | undefined {
    try {
      return this.getProjects().find((p) => p && p.id === id);
    } catch (err) {
      console.error(`Error getting project ${id}:`, err);
      if (id === BASIC_DEMO_PROJECT.id) return BASIC_DEMO_PROJECT;
      if (id === DEMO_PROJECT.id) return DEMO_PROJECT;
      return undefined;
    }
  }

  static createProject(data: { name: string; location: string; description: string }): Project {
    const store = this.getStore();
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name,
      location: data.location,
      description: data.description,
      created_by: 'Authorized Developer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      layout_count: 0,
      total_plots: 0,
      available_plots: 0,
      booked_plots: 0,
      sold_plots: 0,
      total_value: 0,
    };

    store.projects.unshift(newProject);
    saveData(store);

    if (isSupabaseConfigured()) {
      createClient()
        .from('projects')
        .insert({
          id: newProject.id,
          name: newProject.name,
          location: newProject.location,
          description: newProject.description,
          created_by: newProject.created_by,
        })
        .then(
          () => console.log('Project synced to Supabase PostgreSQL'),
          (err: any) => console.warn('Supabase sync warning:', err)
        );
    }

    return newProject;
  }

  // --- LAYOUTS ---
  static getLayoutsByProjectId(projectId: string): Layout[] {
    const store = this.getStore();
    return store.layouts.filter((l) => l.project_id === projectId);
  }

  static getLayoutById(layoutId: string): Layout | undefined {
    const store = this.getStore();
    return store.layouts.find((l) => l.id === layoutId);
  }

  static createLayout(data: {
    project_id: string;
    file_url: string;
    file_type: string;
    width?: number;
    height?: number;
    ai_model?: string;
  }): Layout {
    const store = this.getStore();
    const newLayout: Layout = {
      id: `layout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      project_id: data.project_id,
      file_url: data.file_url,
      file_type: data.file_type,
      original_width: data.width || 1600,
      original_height: data.height || 1200,
      processing_status: 'processing',
      ai_model: data.ai_model || 'Vision-OCR PlotDetector v2.4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.layouts.unshift(newLayout);
    saveData(store);

    if (isSupabaseConfigured()) {
      createClient()
        .from('layouts')
        .insert({
          id: newLayout.id,
          project_id: newLayout.project_id,
          file_url: newLayout.file_url,
          file_type: newLayout.file_type,
          original_width: newLayout.original_width,
          original_height: newLayout.original_height,
          processing_status: newLayout.processing_status,
          ai_model: newLayout.ai_model,
        })
        .then(
          () => console.log('Layout synced to Supabase'),
          (err: any) => console.warn('Supabase sync warning:', err)
        );
    }

    return newLayout;
  }

  static updateLayoutStatus(layoutId: string, status: Layout['processing_status'], error?: string) {
    const store = this.getStore();
    const layout = store.layouts.find((l) => l.id === layoutId);
    if (layout) {
      layout.processing_status = status;
      if (error) layout.processing_error = error;
      layout.updated_at = new Date().toISOString();
      saveData(store);

      if (isSupabaseConfigured()) {
        createClient()
          .from('layouts')
          .update({ processing_status: status, processing_error: error })
          .eq('id', layoutId)
          .then(
            () => {},
            () => {}
          );
      }
    }
  }

  // --- PLOTS ---
  static getPlotsByLayoutId(layoutId: string): Plot[] {
    try {
      const store = this.getStore();
      const plots = (store.plots || []).filter((p) => Boolean(p && p.layout_id === layoutId));
      if (plots.length === 0) {
        if (layoutId === BASIC_DEMO_LAYOUT_ID) return BASIC_DEMO_PLOTS;
        if (layoutId === DEMO_LAYOUT_ID) return DEMO_PLOTS;
      }
      return plots;
    } catch (err) {
      console.error(`Error getting plots for layout ${layoutId}:`, err);
      return [];
    }
  }

  static getPlotById(plotId: string): Plot | undefined {
    try {
      const store = this.getStore();
      return (store.plots || []).find((p) => Boolean(p && p.id === plotId));
    } catch (err) {
      console.error(`Error getting plot ${plotId}:`, err);
      return undefined;
    }
  }

  static updatePlotStatus(
    plotId: string,
    newStatus: PlotStatus,
    changedBy: string = 'User',
    notes?: string,
    customerName?: string,
    customerPhone?: string
  ): Plot | null {
    const store = this.getStore();
    const plot = store.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    const oldStatus = plot.status;
    plot.status = newStatus;
    if (customerName) plot.customer_name = customerName;
    if (customerPhone) plot.customer_phone = customerPhone;
    if (newStatus !== 'available') plot.booking_date = new Date().toISOString();
    plot.updated_at = new Date().toISOString();

    const historyEntry: PlotStatusHistory = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      plot_id: plotId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
    };

    store.history.unshift(historyEntry);
    saveData(store);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase
        .from('plots')
        .update({
          status: newStatus,
          customer_name: plot.customer_name,
          customer_phone: plot.customer_phone,
          booking_date: plot.booking_date,
        })
        .eq('id', plotId)
        .then(
          () => {},
          () => {}
        );

      supabase
        .from('plot_status_history')
        .insert({
          id: historyEntry.id,
          plot_id: plotId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedBy,
          notes: historyEntry.notes,
        })
        .then(
          () => {},
          () => {}
        );
    }

    return plot;
  }

  static updatePlotPolygon(plotId: string, newCoordinates: PolygonPoint[]): Plot | null {
    const store = this.getStore();
    const plot = store.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    plot.polygon_coordinates = newCoordinates;
    plot.updated_at = new Date().toISOString();
    saveData(store);

    if (isSupabaseConfigured()) {
      createClient()
        .from('plots')
        .update({ polygon_coordinates: newCoordinates })
        .eq('id', plotId)
        .then(
          () => {},
          () => {}
        );
    }

    return plot;
  }

  static updatePlotDetails(plotId: string, updates: Partial<Plot>): Plot | null {
    const store = this.getStore();
    const plot = store.plots.find((p) => p.id === plotId);
    if (!plot) return null;

    Object.assign(plot, updates);
    plot.updated_at = new Date().toISOString();
    saveData(store);

    if (isSupabaseConfigured()) {
      createClient()
        .from('plots')
        .update(updates)
        .eq('id', plotId)
        .then(
          () => {},
          () => {}
        );
    }

    return plot;
  }

  static addPlot(plotData: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Plot {
    const store = this.getStore();
    const newPlot: Plot = {
      ...plotData,
      id: `plot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.plots.push(newPlot);
    saveData(store);

    if (isSupabaseConfigured()) {
      createClient()
        .from('plots')
        .insert({
          id: newPlot.id,
          layout_id: newPlot.layout_id,
          plot_number: newPlot.plot_number,
          area: newPlot.area,
          price: newPlot.price,
          facing: newPlot.facing,
          status: newPlot.status,
          polygon_coordinates: newPlot.polygon_coordinates,
          ai_confidence: newPlot.ai_confidence,
          ai_detected: newPlot.ai_detected,
        })
        .then(
          () => {},
          () => {}
        );
    }

    return newPlot;
  }

  static deletePlot(plotId: string): boolean {
    const store = this.getStore();
    const index = store.plots.findIndex((p) => p.id === plotId);
    if (index !== -1) {
      store.plots.splice(index, 1);
      saveData(store);

      if (isSupabaseConfigured()) {
        createClient()
          .from('plots')
          .delete()
          .eq('id', plotId)
          .then(
            () => {},
            () => {}
          );
      }

      return true;
    }
    return false;
  }

  /**
   * Splits a block polygon plot into a grid of R rows x C cols of small individual plots
   */
  static splitPlotIntoGrid(
    plotId: string,
    rows: number,
    cols: number,
    startPlotNumber: number = 1
  ): Plot[] {
    const store = this.getStore();
    const targetPlot = store.plots.find((p) => p.id === plotId);
    if (!targetPlot || rows < 1 || cols < 1) return [];

    const poly = targetPlot.polygon_coordinates;
    const xs = poly.map((pt) => pt[0]);
    const ys = poly.map((pt) => pt[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const cellW = (maxX - minX) / cols;
    const cellH = (maxY - minY) / rows;
    const subArea = Math.round(targetPlot.area / (rows * cols));

    const newPlots: Plot[] = [];
    let currentNum = startPlotNumber;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x1 = Math.round(minX + c * cellW);
        const y1 = Math.round(minY + r * cellH);
        const x2 = Math.round(x1 + cellW - 2);
        const y2 = Math.round(y1 + cellH - 2);

        const subPoly: PolygonPoint[] = [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
        ];

        const newPlot: Plot = {
          id: `plot-${Date.now()}-${r}-${c}-${Math.random().toString(36).slice(2, 6)}`,
          layout_id: targetPlot.layout_id,
          plot_number: `${currentNum}`,
          area: subArea || 1440,
          price: (subArea || 1440) * 2400,
          facing: targetPlot.facing || 'North',
          status: 'available',
          polygon_coordinates: subPoly,
          ai_confidence: 0.96,
          ai_detected: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        newPlots.push(newPlot);
        currentNum++;
      }
    }

    // Delete target block plot & push new small plots
    this.deletePlot(plotId);
    newPlots.forEach((np) => store.plots.push(np));
    saveData(store);

    return newPlots;
  }

  // --- ROADS ---
  static getRoadsByLayoutId(layoutId: string): Road[] {
    const store = this.getStore();
    return store.roads.filter((r) => r.layout_id === layoutId);
  }

  // --- STATUS HISTORY ---
  static getPlotHistory(plotId: string): PlotStatusHistory[] {
    const store = this.getStore();
    return store.history
      .filter((h) => h.plot_id === plotId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }

  static realignLayoutGrid(layoutId: string, width?: number, height?: number): Plot[] {
    const store = this.getStore();
    const layout = store.layouts.find((l) => l.id === layoutId);
    const w = width || layout?.original_width || 1200;
    const h = height || layout?.original_height || 964;

    const result = LayoutAnalyzerService.generate48PlotGrid(w, h);

    // Remove existing plots & roads for this layout
    store.plots = store.plots.filter((p) => p.layout_id !== layoutId);
    store.roads = store.roads.filter((r) => r.layout_id !== layoutId);

    const newPlots: Plot[] = result.plots.map((p, idx) => ({
      id: `plot-${layoutId}-${p.plot_number}-${Date.now()}-${idx}`,
      layout_id: layoutId,
      plot_number: p.plot_number,
      area: p.area,
      price: p.price || p.area * 2500,
      facing: p.facing,
      status: idx % 6 === 0 ? 'booked' : idx % 9 === 0 ? 'sold' : 'available',
      polygon_coordinates: p.polygon,
      ai_confidence: p.confidence,
      ai_detected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const newRoads: Road[] = result.roads.map((r, idx) => ({
      id: `road-${layoutId}-${idx}`,
      layout_id: layoutId,
      name: r.name,
      polygon_coordinates: r.polygon,
      created_at: new Date().toISOString(),
    }));

    store.plots.push(...newPlots);
    store.roads.push(...newRoads);
    saveData(store);

    return newPlots;
  }

  static resetDemoData(): Project[] {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return this.getProjects();
  }
}
