"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { api, errorText, type Vehicle } from "@/lib/api"

export function VehicleDialog({ onCreated, trigger }: { onCreated: (v: Vehicle) => void; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const year = String(f.get("year") ?? "").trim()
    setBusy(true)
    setError(null)
    try {
      const v = await api.addVehicle({
        license_plate: String(f.get("plate")).trim().toUpperCase(),
        brand: String(f.get("brand")).trim(),
        model: String(f.get("model") ?? "").trim() || null,
        year: year ? Number(year) : null,
      })
      toast.success("Đã thêm xe.")
      onCreated(v)
      setOpen(false)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button type="button" variant="outline"><Plus className="size-4" />Thêm xe</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm xe</DialogTitle>
          <DialogDescription>Biển số dùng để Trung tâm nhận diện xe khi đến.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plate">Biển số</Label>
            <Input id="plate" name="plate" required placeholder="51K-123.45" autoComplete="off" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">Hãng xe</Label>
              <Input id="brand" name="brand" required placeholder="Toyota" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Dòng xe</Label>
              <Input id="model" name="model" placeholder="Vios" />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-1/2">
            <Label htmlFor="year">Năm sản xuất</Label>
            <Input id="year" name="year" type="number" inputMode="numeric" min={1950} max={2100} placeholder="2020" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>{busy && <Spinner />}Lưu xe</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
