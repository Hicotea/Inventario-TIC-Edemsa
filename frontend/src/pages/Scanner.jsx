import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, ArrowDownRight, ArrowUpRight, Eye, ScanLine, Loader2, X, RotateCcw, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { api, showError, showSuccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/testIds";

const SCANNER_ELEMENT_ID = "scanner-viewport";

export default function Scanner() {
  const navigate = useNavigate();
  const { hasPerm } = useAuth();
  const scannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [showQuick, setShowQuick] = useState(false);
  const [quickType, setQuickType] = useState(null); // 'entry'|'exit'
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    return () => { stop(); }; // cleanup on unmount
    // eslint-disable-next-line
  }, []);

  const lookup = async (code) => {
    try {
      const { data } = await api.get("/scan/lookup", { params: { code } });
      setProduct(data);
      setError("");
      showSuccess(`Found: ${data.name}`);
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (e) {
      setError(e?.friendlyMessage || "No product matches this code.");
      showError(e, "No product matches this code.");
    }
  };

  const start = async () => {
    setError(""); setStarting(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, /* verbose */ false);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decoded) => {
          if (!scannerRef.current) return;
          try { await scanner.pause(true); } catch {}
          await lookup(decoded);
          setRunning(false);
          try { await scanner.stop(); await scanner.clear(); scannerRef.current = null; } catch {}
        },
        () => {} // ignore scan errors (frequent)
      );
      setRunning(true);
    } catch (e) {
      setError("Unable to access camera. Please allow permissions or use manual entry.");
    } finally {
      setStarting(false);
    }
  };

  const stop = async () => {
    const s = scannerRef.current;
    if (s) {
      try { await s.stop(); } catch {}
      try { await s.clear(); } catch {}
      scannerRef.current = null;
    }
    setRunning(false);
  };

  const openQuick = (type) => { setQuickType(type); setQty("1"); setReason(""); setShowQuick(true); };

  const submitQuick = async () => {
    if (!product || !quickType) return;
    setSubmitting(true);
    try {
      const body = { product_id: product.id, qty: Number(qty), reason: reason || undefined };
      await api.post(`/movements/${quickType}`, body);
      showSuccess(`${quickType === "entry" ? "Entry" : "Exit"} recorded.`);
      setShowQuick(false);
      // Refresh product
      const { data } = await api.get(`/products/${product.id}`);
      setProduct(data);
    } catch (e) { showError(e); }
    finally { setSubmitting(false); }
  };

  const canMove = hasPerm("movement:write");

  return (
    <div>
      <PageHeader
        title="Scanner"
        description="Point your device camera at a QR or barcode to find a product instantly."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Scanner" }]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Camera</div>
            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="outline" size="sm" onClick={stop} data-testid={TID.scannerStop}><CameraOff size={16} className="mr-2" />Stop</Button>
              ) : (
                <Button size="sm" onClick={start} disabled={starting} data-testid={TID.scannerStart}>
                  {starting ? <><Loader2 className="mr-2 animate-spin" size={16}/>Starting…</> : <><Camera size={16} className="mr-2" />Start camera</>}
                </Button>
              )}
            </div>
          </div>

          <div className="relative mt-3 aspect-square w-full max-w-[420px] mx-auto overflow-hidden rounded-2xl border border-border bg-black/95">
            <div id={SCANNER_ELEMENT_ID} className="absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            {!running && !starting && (
              <div className="absolute inset-0 grid place-items-center text-center text-white/70">
                <div className="flex flex-col items-center gap-2 p-6">
                  <ScanLine size={40} />
                  <div className="font-display text-sm">Camera off</div>
                  <div className="text-xs opacity-80">Tap “Start camera” to scan a QR or barcode.</div>
                </div>
              </div>
            )}
            {/* viewfinder */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-[250px] w-[250px] rounded-xl border-2 border-white/70" />
            </div>
          </div>

          {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-sm font-medium"><KeyRound size={14} /> Manual entry</div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                data-testid={TID.scannerManualInput}
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Type SKU, barcode or QR value…"
                onKeyDown={e => { if (e.key === "Enter" && manualCode.trim()) lookup(manualCode.trim()); }}
              />
              <Button data-testid={TID.scannerManualSubmit} onClick={() => manualCode.trim() && lookup(manualCode.trim())}>Look up</Button>
            </div>
          </div>
        </Card>

        <Card className="p-4" data-testid={TID.scannerResult}>
          <div className="font-display text-sm font-semibold">Scan result</div>
          {!product ? (
            <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing scanned yet. Start the camera or use manual entry.
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold truncate">{product.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{product.sku}</div>
                </div>
                <StatusBadge status={product.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Stock</div><div className="text-xl font-semibold tabular-nums">{product.stock}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Location</div><div className="truncate">{product.location_name || "—"}</div></div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {canMove && (
                  <>
                    <Button onClick={() => openQuick("entry")} data-testid={TID.scannerQuickEntry} className="h-11 justify-start"><ArrowDownRight size={16} className="mr-2" /> Quick entry (+)</Button>
                    <Button onClick={() => openQuick("exit")} data-testid={TID.scannerQuickExit} variant="outline" className="h-11 justify-start"><ArrowUpRight size={16} className="mr-2" /> Quick exit (-)</Button>
                  </>
                )}
                <Button variant="outline" onClick={() => navigate(`/products/${product.id}`)} data-testid={TID.scannerView} className="h-11 justify-start">
                  <Eye size={16} className="mr-2" /> View full details
                </Button>
                <Button variant="ghost" onClick={() => setProduct(null)} className="h-10 justify-start text-muted-foreground">
                  <RotateCcw size={14} className="mr-2" /> Scan another
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showQuick} onOpenChange={setShowQuick}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{quickType === "entry" ? "Quick entry" : "Quick exit"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="font-medium truncate">{product?.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{product?.sku}</div>
              <div className="mt-1 text-sm">Current stock: <span className="font-semibold tabular-nums">{product?.stock}</span></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder={quickType === "entry" ? "e.g. restock" : "e.g. employee request"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuick(false)}>Cancel</Button>
            <Button onClick={submitQuick} disabled={submitting || !Number(qty)}>
              {submitting ? <><Loader2 className="mr-2 animate-spin" size={16}/>Saving…</> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
