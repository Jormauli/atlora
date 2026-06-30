"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { CirclePlus, Orbit, Search, Settings, WalletCards } from "lucide-react";
import {
  buildCardFilters,
  filterDashboardCards,
  type DashboardCard,
  type DashboardSort
} from "@/lib/dashboard/card-view-model";
import { brand } from "@/lib/brand";
import { LanguageToggle, useLanguage } from "@/components/language-provider";
import { BrandMark } from "@/components/brand-mark";
import { CardDetailModal, type CardOriginRect } from "./dashboard/card-detail-modal";
import { KnowledgeCard } from "./dashboard/knowledge-card";
import { RoleFilterBar } from "./dashboard/role-filter-bar";
import { SidebarLink } from "./dashboard/sidebar-link";

export function DashboardWorkspace({ cards }: { cards: DashboardCard[] }) {
  const { copy } = useLanguage();
  const [visibleCards, setVisibleCards] = useState(cards);
  const [query, setQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["all"]);
  const [sort, setSort] = useState<DashboardSort>("desc");
  const [expandedCard, setExpandedCard] = useState<{ cardId: string; rect: CardOriginRect } | null>(null);

  const filters = useMemo(() => buildCardFilters(visibleCards), [visibleCards]);
  const filteredCards = useMemo(
    () => filterDashboardCards(visibleCards, { query, selectedRoleIds: selectedRoles, activeTag: "", sort }),
    [visibleCards, query, selectedRoles, sort]
  );

  const selectedCard = visibleCards.find((card) => card.id === expandedCard?.cardId) ?? null;
  const selectedRoleLabels = selectedRoles.includes("all")
    ? ["all"]
    : filters.roles.filter((role) => selectedRoles.includes(role.id)).map((role) => role.label);

  function openCard(cardId: string, event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setExpandedCard({
      cardId,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    });
  }

  function toggleRole(roleId: string) {
    if (roleId === "all") {
      setSelectedRoles(["all"]);
      return;
    }

    setSelectedRoles([roleId]);
  }

  function removeCardFromView(cardId: string) {
    setExpandedCard(null);
    setVisibleCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#f3f3f1]">
      <div className="flex min-h-screen">
        <DashboardSidebar cards={visibleCards.slice(0, 4)} cardCount={visibleCards.length} query={query} onQueryChange={setQuery} onOpenCard={openCard} />

        <main className="spectral-surface min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[#8f8f8a]">{copy.dashboard.eyebrow}</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">{copy.product.subtitle}</h1>
              <p className="mt-1 text-sm text-[#b4b4b1]">{copy.product.description}</p>
              <div className="mt-3 flex h-1.5 w-28 overflow-hidden rounded-full bg-[#242424]" aria-hidden="true">
                <span className="h-full flex-1 bg-[#4f6f8f]" />
                <span className="h-full flex-1 bg-[#b48745]" />
                <span className="h-full flex-1 bg-[#9a554b]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Link
                href="/new"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#4f6f8f] bg-[#e7e7e3] px-3 text-sm font-medium leading-none text-[#111111] hover:bg-white"
              >
                <CirclePlus className="h-4 w-4" />
                <span className="min-w-0 truncate">{copy.navigation.newCard}</span>
              </Link>
            </div>
          </header>

          <DashboardMobileNav cardCount={visibleCards.length} />

          <RoleFilterBar roles={filters.roles} selectedRoles={selectedRoles} onToggle={toggleRole} />

          <FilterToolbar
            query={query}
            selectedRoles={selectedRoles}
            sort={sort}
            onQueryChange={setQuery}
            onSortChange={setSort}
            copy={copy}
          />

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <KnowledgeCard key={card.id} card={card} onOpen={(event) => openCard(card.id, event)} />
            ))}
          </section>

          {filteredCards.length === 0 ? (
            <div className="mt-10 rounded-md border border-dashed border-[#2f2f2f] bg-[#171717] p-8 text-center text-sm text-[#b4b4b1]">
              {copy.dashboard.empty}
            </div>
          ) : null}
        </main>
      </div>

      {selectedCard && expandedCard ? (
        <CardDetailModal
          card={selectedCard}
          originRect={expandedCard.rect}
          selectedRoleLabels={selectedRoleLabels}
          onClose={() => setExpandedCard(null)}
          onDelete={removeCardFromView}
        />
      ) : null}
    </div>
  );
}

function DashboardMobileNav({ cardCount }: { cardCount: number }) {
  const { copy } = useLanguage();
  const links = [
    { href: "/dashboard", icon: <Orbit className="h-4 w-4" />, label: copy.navigation.library, badge: cardCount },
    { href: "/new", icon: <CirclePlus className="h-4 w-4" />, label: copy.navigation.newMaterial },
    { href: "/usage", icon: <WalletCards className="h-4 w-4" />, label: copy.navigation.usage },
    { href: "/settings", icon: <Settings className="h-4 w-4" />, label: copy.navigation.settings }
  ];

  return (
    <nav className="mt-4 grid grid-cols-4 gap-2 text-xs lg:hidden" aria-label={copy.navigation.library}>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-[#2f2f2f] bg-[#171717] px-2 py-2 text-center leading-none text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
        >
          {item.icon}
          <span className="max-w-full truncate">{item.label}</span>
          {item.badge !== undefined ? <span className="sr-only">{item.badge}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

function DashboardSidebar({
  cards,
  cardCount,
  query,
  onQueryChange,
  onOpenCard
}: {
  cards: DashboardCard[];
  cardCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenCard: (cardId: string, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const { copy } = useLanguage();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[#2f2f2f] bg-[#151515] px-3 py-4 lg:block">
      <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-[#f3f3f1] hover:bg-white/[0.06]">
        <BrandMark className="h-6 w-6 shrink-0" />
        <span>
          <span className="block leading-tight">{brand.name.en}</span>
          <span className="block text-xs font-normal text-[#8f8f8a]">{copy.product.subtitle}</span>
        </span>
      </Link>
      <div className="mt-3 flex items-center rounded-md border border-[#2f2f2f] bg-[#111111] px-2 py-1.5 text-sm text-[#d8d8d5]">
        <Search className="mr-2 h-4 w-4" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.dashboard.search}
          className="w-full bg-transparent outline-none placeholder:text-[#767672]"
        />
      </div>
      <nav className="mt-4 space-y-1 text-sm">
        <SidebarLink href="/new" icon={<CirclePlus className="h-4 w-4" />} label={copy.navigation.newMaterial} shortcut="⌘N" />
        <SidebarLink href="/dashboard" icon={<Orbit className="h-4 w-4" />} label={copy.navigation.library} badge={cardCount} active />
        <SidebarLink href="/usage" icon={<WalletCards className="h-4 w-4" />} label={copy.navigation.usage} shortcut="M" />
        <SidebarLink href="/settings" icon={<Settings className="h-4 w-4" />} label={copy.navigation.settings} />
      </nav>
      <div className="mt-8 px-2 text-xs font-medium text-[#8f8f8a]">{copy.navigation.recent}</div>
      <div className="mt-2 space-y-1">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={(event) => onOpenCard(card.id, event)}
            title={card.title}
            className="line-clamp-2 min-h-[2.75rem] w-full rounded-md px-2 py-1.5 text-left text-xs leading-5 text-[#b4b4b1] break-words hover:bg-white/[0.06] hover:text-white"
          >
            {card.title}
          </button>
        ))}
      </div>
    </aside>
  );
}

function FilterToolbar({
  query,
  selectedRoles,
  sort,
  onQueryChange,
  onSortChange,
  copy
}: {
  query: string;
  selectedRoles: string[];
  sort: DashboardSort;
  onQueryChange: (value: string) => void;
  onSortChange: (value: DashboardSort) => void;
  copy: ReturnType<typeof useLanguage>["copy"];
}) {
  return (
    <section className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-[210px_1fr]">
        <label className="flex min-w-0 items-center gap-2 text-sm text-[#b4b4b1]">
          {copy.dashboard.sort}
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as DashboardSort)}
            className="h-8 rounded border border-[#2f2f2f] bg-[#171717] px-2 text-sm text-[#f3f3f1] outline-none focus:ring-2 focus:ring-[#4f6f8f]"
          >
            <option value="desc">{copy.dashboard.newest}</option>
            <option value="asc">{copy.dashboard.oldest}</option>
          </select>
        </label>
        <label className="flex h-8 min-w-0 items-center rounded border border-[#2f2f2f] bg-[#171717] px-2 text-sm text-[#b4b4b1]">
          <Search className="mr-2 h-4 w-4" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={selectedRoles.includes("all") ? copy.dashboard.searchAll : copy.dashboard.searchSelected}
            className="w-full bg-transparent outline-none placeholder:text-[#767672] focus:ring-[#4f6f8f]"
          />
        </label>
      </div>
    </section>
  );
}
