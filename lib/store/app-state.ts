'use client';

import { Project, Layout, Plot, Road, PlotStatusHistory, PlotStatus, PolygonPoint } from '@/types';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const STORAGE_KEY = 'plotwise_ai_app_data_v4';

interface AppStoreData {
  projects: Project[];
  layouts: Layout[];
  plots: Plot[];
  roads: Road[];
  history: PlotStatusHistory[];
}

function getInitialData(): AppStoreData {
  const emptyInitial: AppStoreData = {
    projects: [],
    layouts: [],
    plots: [],
    roads: [],
    history: [],
  };

  if (typeof window === 'undefined') {
    return emptyInitial;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        layouts: Array.isArray(parsed.layouts) ? parsed.layouts : [],
        plots: Array.isArray(parsed.plots) ? parsed.plots : [],
        roads: Array.isArray(parsed.roads) ? parsed.roads : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    }
  } catch (err) {
    console.error('Failed to load store from localStorage:', err);
  }

  return emptyInitial;
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
   * Comprehensive Supabase Cloud Synchronization
   */
  public static async syncFromSupabase() {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const store = this.getStore();

      // 1. Fetch Projects
      const { data: dbProjects, error: pErr } = await supabase.from('projects').select('*');
      if (!pErr && dbProjects) {
        store.projects = dbProjects;
      }

      // 2. Fetch Layouts
      const { data: dbLayouts, error: lErr } = await supabase.from('layouts').select('*');
      if (!lErr && dbLayouts) {
        store.layouts = dbLayouts;
      }

      // 3. Fetch Plots
      const { data: dbPlots, error: plErr } = await supabase.from('plots').select('*');
      if (!plErr && dbPlots) {
        store.plots = dbPlots;
      }

      saveData(store);
      console.log('[Supabase Cloud Sync] Clean store updated from Supabase database.');
    } catch (err) {
      console.warn('Supabase cloud sync warning:', err);
    }
  }

  // --- PROJECTS ---
  static getProjects(): Project[] {
    try {
      const store = this.getStore();
      const validProjects = (store.projects || []).filter((p): p is Project => Boolean(p && p.id));
      const validPlots = (store.plots || []).filter((pl) => Boolean(pl && pl.id));
      const validLayouts = (store.layouts || []).filter((l) => Boolean(l && l.id));

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
      return [];
    }
  }

  static getProjectById(id: string): Project | undefined {
    try {
      return this.getProjects().find((p) => p && p.id === id);
    } catch (err) {
      console.error(`Error getting project ${id}:`, err);
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
      created_by: 'usr-admin-1',
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
          created_by: 'usr-admin-1',
        })
        .then(
          ({ error }) => {
            if (error) {
              console.error('[Supabase Error] Projects insert failed:', error.message, error.details);
            } else {
              console.log('[Supabase Sync] New Project synced to Supabase projects table successfully!');
            }
          }
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
        })
        .then(
          () => console.log('[Supabase Sync] Layout synced to Supabase layouts table.'),
          (err: any) => console.warn('Supabase layout sync warning:', err)
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
          .update({ processing_status: status })
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
      return (store.plots || []).filter((p) => Boolean(p && p.layout_id === layoutId));
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

    if (customerName !== undefined) plot.customer_name = customerName;
    if (customerPhone !== undefined) plot.customer_phone = customerPhone;

    if (newStatus === 'available') {
      if (!customerName) plot.customer_name = undefined;
      if (!customerPhone) plot.customer_phone = undefined;
      plot.booking_date = undefined;
    } else {
      if (!plot.booking_date) plot.booking_date = new Date().toISOString();
    }
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
          customer_name: plot.customer_name || null,
          customer_phone: plot.customer_phone || null,
          booking_date: plot.booking_date || null,
        })
        .eq('id', plotId)
        .then(
          ({ error }) => {
            if (error) console.warn('[Supabase Warning] Plot status update failed:', error.message);
            else console.log('[Supabase Sync] Plot status & allotment info synced to Supabase.');
          }
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
          () => console.log('[Supabase Sync] Plot inserted to Supabase plots table.'),
          (err: any) => console.warn('Supabase plot sync error:', err)
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
    newPlots.forEach((np) => this.addPlot(np));
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
      status: 'available',
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

  static resetStore() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
