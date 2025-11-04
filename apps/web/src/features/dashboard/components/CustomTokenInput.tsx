import ThemedButton from "@/components/themed/button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default function CustomTokenInput() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <ThemedButton
            style="primary"
            variant="outline"
            size="lg"
            className="w-74 md:w-112 mt-2"
          >
            <Plus /> Add Token
          </ThemedButton>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px] bg-custom-secondary-color
        neo-shadow-sm border-2 border-custom-primary-color"
        >
          <DialogHeader>
            <DialogTitle>Add Token</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="address-1">Contract Address/Mint</Label>
              <Input id="address-1" name="address" defaultValue="0x" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-custom-primary-color text-custom-tertiary-text cursor-pointer
              hover:bg-custom-primary-color hover:text-custom-tertiary-text"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
