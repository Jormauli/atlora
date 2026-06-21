import { FileText, ImageIcon, Link2, Sparkles, Tags } from "lucide-react";

export type PublicHomeFlowVariant = "input" | "extract" | "card";

export function PublicHomeFlowVisual({ variant }: { variant: PublicHomeFlowVariant }) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[16/10] overflow-hidden rounded-md border border-[#343434] bg-[#151515] shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
    >
      <div className="absolute inset-x-0 top-0 h-8 border-b border-[#303030] bg-[#191919]">
        <span className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full bg-[#4f6f8f]" />
        <span className="absolute left-6 top-3 h-1.5 w-1.5 rounded-full bg-[#b48745]" />
        <span className="absolute left-9 top-3 h-1.5 w-1.5 rounded-full bg-[#9a554b]" />
      </div>
      {variant === "input" && <InputVisual />}
      {variant === "extract" && <ExtractVisual />}
      {variant === "card" && <CardVisual />}
    </div>
  );
}

function InputVisual() {
  return (
    <div className="absolute inset-x-5 bottom-5 top-12">
      <div className="grid grid-cols-3 gap-2">
        {[Link2, FileText, ImageIcon].map((Icon, index) => (
          <div key={index} className={`grid h-8 place-items-center rounded border ${index === 0 ? "border-[#4f6f8f] bg-[#4f6f8f]/15" : "border-[#303030] bg-[#191919]"}`}>
            <Icon className={`h-3.5 w-3.5 ${index === 0 ? "text-[#7794b0]" : "text-[#747471]"}`} />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded border border-[#303030] bg-[#111111] p-3">
        <div className="flex h-7 items-center gap-2 rounded border border-[#343434] bg-[#171717] px-2.5">
          <Link2 className="h-3 w-3 text-[#7794b0]" />
          <span className="h-1.5 w-2/3 rounded-full bg-[#494947]" />
          <span className="ml-auto h-1.5 w-8 rounded-full bg-[#2f2f2e]" />
        </div>
        <div className="mt-3 space-y-2">
          <span className="block h-1.5 w-full rounded-full bg-[#343432]" />
          <span className="block h-1.5 w-5/6 rounded-full bg-[#30302f]" />
          <span className="block h-1.5 w-2/3 rounded-full bg-[#2b2b2a]" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4f6f8f]" /><span className="h-2 w-2 rounded-full bg-[#30302f]" /></div>
        <div className="grid h-7 w-12 place-items-center rounded bg-[#d8d8d4]"><Sparkles className="h-3.5 w-3.5 text-[#242424]" /></div>
      </div>
    </div>
  );
}

function ExtractVisual() {
  return (
    <div className="absolute inset-x-5 bottom-5 top-12 grid grid-cols-[1fr_54px_1.2fr] items-center gap-3">
      <div className="space-y-3">
        {[Link2, FileText, ImageIcon].map((Icon, index) => (
          <div key={index} className="flex h-9 items-center gap-2 rounded border border-[#303030] bg-[#191919] px-2.5">
            <Icon className={`h-3.5 w-3.5 ${index === 0 ? "text-[#7794b0]" : index === 1 ? "text-[#c49b5c]" : "text-[#ad6a61]"}`} />
            <div className="min-w-0 flex-1 space-y-1.5"><span className="block h-1.5 w-full rounded-full bg-[#41413f]" /><span className="block h-1 w-2/3 rounded-full bg-[#2e2e2d]" /></div>
          </div>
        ))}
      </div>
      <div className="relative grid h-full place-items-center">
        <span className="absolute left-0 right-0 top-1/2 h-px bg-[#363636]" />
        <span className="flow-signal absolute left-0 top-[calc(50%-3px)] h-1.5 w-1.5 rounded-full bg-[#b48745]" />
        <span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#526b83] bg-[#21303d] shadow-[0_0_24px_rgba(79,111,143,0.2)]"><Sparkles className="h-4 w-4 text-[#8aa3bb]" /></span>
      </div>
      <div className="space-y-2">
        {["#4f6f8f", "#b48745", "#9a554b"].map((color, index) => (
          <div key={color} className="rounded border border-[#303030] bg-[#191919] p-2.5">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span className="h-1.5 rounded-full bg-[#4a4a47]" style={{ width: `${72 - index * 9}%` }} /></div>
            <div className="mt-2 space-y-1.5"><span className="block h-1 w-full rounded-full bg-[#30302f]" /><span className="block h-1 w-3/4 rounded-full bg-[#292928]" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardVisual() {
  return (
    <div className="absolute inset-x-5 bottom-4 top-11 rounded border border-[#343434] bg-[#181d1b]">
      <div className="flex items-center gap-3 border-b border-[#303835] px-4 py-3">
        <div className="relative h-9 w-9 shrink-0 rounded-full bg-[#4f6f8f]">
          <span className="absolute left-2 top-1.5 h-2 w-2 rounded-full bg-black/15" />
          <span className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border border-white/10 bg-black/10" />
        </div>
        <div className="min-w-0 flex-1 space-y-2"><span className="block h-2 w-3/4 rounded-full bg-[#d7d7d2]" /><span className="block h-1.5 w-1/2 rounded-full bg-[#62625f]" /></div>
        <Tags className="h-4 w-4 text-[#b48745]" />
      </div>
      <div className="space-y-2.5 p-3">
        <div className="rounded border border-[#303835] bg-[#121614] p-2.5"><span className="block h-1.5 w-full rounded-full bg-[#555552]" /><span className="mt-2 block h-1.5 w-4/5 rounded-full bg-[#363634]" /></div>
        {["#4f6f8f", "#b48745", "#9a554b"].map((color, index) => (
          <div key={color} className="flex items-center gap-2.5 rounded border border-[#303835] bg-[#121614] px-2.5 py-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div className="min-w-0 flex-1 space-y-1.5"><span className="block h-1.5 rounded-full bg-[#51514e]" style={{ width: `${76 - index * 8}%` }} /><span className="block h-1 w-full rounded-full bg-[#2f2f2d]" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
