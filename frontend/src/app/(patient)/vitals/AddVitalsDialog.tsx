import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"

export interface AddVitalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

export function AddVitalsDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddVitalsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="shrink-0 gap-2">
          <PlusIcon className="size-4" />
          Add Vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add Vitals</DialogTitle>
            <DialogDescription>
              Enter your latest measurements to keep your health tracking up to date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="systolic">Systolic (mmHg)</Label>
                <Input id="systolic" placeholder="120" type="number" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                <Input id="diastolic" placeholder="80" type="number" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input id="heartRate" placeholder="72" type="number" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="spo2">SpO₂ (%)</Label>
                <Input id="spo2" placeholder="98" type="number" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" placeholder="75.5" type="number" step="0.1" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" placeholder="36.8" type="number" step="0.1" required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit Measurements</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
