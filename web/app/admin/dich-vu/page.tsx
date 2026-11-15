"use client"

import { Pencil, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ErrorNote } from "@/components/error-note"
import { AdminPage } from "@/components/layout/admin-page"
import { PageHeader } from "@/components/layout/page-header"
import { RequireManager } from "@/components/shell/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { api, errorText, type Service } from "@/lib/api"
import { formatVND } from "@/lib/format"
import { useApi } from "@/lib/use-api"

function ServiceDialog({ service, open, onOpenChange, onSaved }: { service: Service | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const body = {
      name: String(f.get("name")).trim(),
      description: String(f.get("description") ?? "").trim() || null,
      duration_minutes: Number(f.get("duration")),
      reference_price: Number(f.get("price")),
    }
    setBusy(true)
    setError(null)
    try {
      if (service) await api.updateService(service.service_id, body)
      else await api.createService(body)
      toast.success(service ? "Đã lưu dịch vụ." : "Đã thêm dịch vụ.")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setError(errorText(err, "staff"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle>
          <DialogDescription>Giá chỉ để tham khảo, không thanh toán trên hệ thống.</DialogDescription>
        </DialogHeader>
        <form key={service?.service_id ?? "new"} onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2"><Label htmlFor="s-name">Tên dịch vụ</Label><Input id="s-name" name="name" required defaultValue={service?.name} /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="s-desc">Mô tả</Label><Textarea id="s-desc" name="description" defaultValue={service?.description ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2"><Label htmlFor="s-dur">Thời lượng (phút)</Label><Input id="s-dur" name="duration" type="number" inputMode="numeric" min={1} required defaultValue={service?.duration_minutes ?? 60} /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="s-price">Giá tham khảo (đ)</Label><Input id="s-price" name="price" type="number" inputMode="numeric" min={0} required defaultValue={service?.reference_price ?? 0} /></div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="submit" disabled={busy}>{busy && <Spinner />}Lưu</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Services() {
  const { data, error, loading, reload } = useApi(() => api.services(true), [])
  const [editing, setEditing] = useState<Service | null>(null)
  const [open, setOpen] = useState(false)
  const edit = (s: Service | null) => { setEditing(s); setOpen(true) }
  async function toggle(s: Service, active: boolean) {
    try { await api.updateService(s.service_id, { is_active: active }); toast.success(active ? "Đã bật dịch vụ." : "Đã ngừng dịch vụ."); reload() }
    catch (e) { toast.error(errorText(e, "staff")) }
  }
  const items = data ?? []
  return (
    <AdminPage>
      <PageHeader size="sm" title="Dịch vụ" description={loading ? "Đang tải" : `${items.length} dịch vụ`} actions={<Button onClick={() => edit(null)}><Plus className="size-4" />Thêm dịch vụ</Button>} />
      <ErrorNote error={error} who="staff" />
      {loading ? <div className="flex flex-col gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div> : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((s) => (
              <li key={s.service_id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2"><span className="font-medium">{s.name}</span>{s.is_active === false && <Badge variant="cancelled">Ngừng</Badge>}</div>
                <span className="text-xs text-muted-foreground">{s.duration_minutes} phút · {formatVND(s.reference_price)}</span>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={s.is_active !== false} onCheckedChange={(v) => toggle(s, v)} aria-label={`Bật dịch vụ ${s.name}`} />Đang hoạt động</label>
                  <Button size="sm" variant="outline" onClick={() => edit(s)}><Pencil className="size-4" />Sửa</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Dịch vụ</TableHead><TableHead>Thời lượng</TableHead><TableHead>Giá tham khảo</TableHead><TableHead>Hoạt động</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.service_id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="">{s.duration_minutes} phút</TableCell>
                    <TableCell className="">{formatVND(s.reference_price)}</TableCell>
                    <TableCell><Switch checked={s.is_active !== false} onCheckedChange={(v) => toggle(s, v)} aria-label={`Bật dịch vụ ${s.name}`} /></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => edit(s)}><Pencil className="size-4" />Sửa</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <ServiceDialog service={editing} open={open} onOpenChange={setOpen} onSaved={reload} />
    </AdminPage>
  )
}

export default function AdminServicesPage() { return <RequireManager><Services /></RequireManager> }
