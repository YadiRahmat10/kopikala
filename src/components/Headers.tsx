import { useState } from "react";
import { IonHeader, useIonActionSheet } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useApp } from "../state/AppState";
import { CAFE } from "../data/seed";
import { isOpen, pad2 } from "../lib/format";
import { Icon } from "./ui";
import { NotificationBell } from "./OrderNotifications";
import { GlassSheet } from "./GlassSettings";

function Logo() {
  return (
    <div className="icon-btn glass-tint h-9 w-9 text-secondary-container">
      <Icon name="local_cafe" size={20} fill />
    </div>
  );
}

export function GuestHeader() {
  const { now, session, isStaff, logout } = useApp();
  const history = useHistory();
  const [presentSheet] = useIonActionSheet();
  const [glassOpen, setGlassOpen] = useState(false);
  const open = isOpen(now);
  const name = session?.name ?? "Tamu";

  const openAccount = () =>
    presentSheet({
      header: `Halo, ${name}`,
      buttons: [
        { text: "Tampilan Kaca", handler: () => setGlassOpen(true) },
        {
          text: "Keluar",
          role: "destructive",
          handler: () => {
            logout();
            history.replace("/masuk");
          },
        },
        { text: "Batal", role: "cancel" },
      ],
    });

  return (
    <IonHeader className="kk-header ion-no-border">
      <div className="pt-safe glass-bar">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-headline-sm text-primary">
                {CAFE.name}
              </span>
              <span
                className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-label-sm ${open ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
              >
                {open ? "Buka" : "Tutup"} : ( {pad2(CAFE.open)}.00 -{" "}
                {pad2(CAFE.close)}.00 )
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              isStaff ? history.push("/staf/ringkasan") : openAccount()
            }
            className="glass-btn flex min-h-[44px] max-w-[45%] shrink-0 items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 transition-all active:scale-[0.98]"
          >
            <span className="icon-btn h-8 w-8 bg-primary-container text-label-lg text-on-primary">
              {isStaff ? (
                <Icon name="admin_panel_settings" size={18} />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="flex min-w-0 flex-col items-start">
              <span className="max-w-full truncate text-label-sm leading-none text-primary">
                {isStaff ? "Panel Admin" : name}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant">
                <Icon name={isStaff ? "dashboard" : "person"} size={12} />
                {isStaff ? "Kembali" : "Pelanggan"}
              </span>
            </span>
          </button>
        </div>
      </div>
      <GlassSheet isOpen={glassOpen} onClose={() => setGlassOpen(false)} />
    </IonHeader>
  );
}

export function StaffHeader({ title }: { title: string }) {
  const { logout } = useApp();
  const history = useHistory();
  const [presentSheet] = useIonActionSheet();
  const [glassOpen, setGlassOpen] = useState(false);

  const openProfile = () =>
    presentSheet({
      header: `${CAFE.staffName} • ${CAFE.shift}`,
      buttons: [
        {
          text: "Lihat Sebagai Pelanggan",
          handler: () => history.push("/tamu/beranda"),
        },
        { text: "Tampilan Kaca", handler: () => setGlassOpen(true) },
        {
          text: "Keluar dari Admin",
          role: "destructive",
          handler: () => {
            logout();
            history.replace('/masuk');
          },
        },
        { text: "Batal", role: "cancel" },
      ],
    });

  return (
    <IonHeader className="kk-header ion-no-border">
      <div className="pt-safe glass-bar">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1 text-label-sm text-secondary">
              <Icon name="local_cafe" size={14} /> KopiKala Staf Hub
            </span>
            <div className="flex items-center gap-2">
              <h1 className="truncate text-headline-sm text-primary">
                {title}
              </h1>
              <span className="chip bg-secondary-container/70 text-on-secondary-container">
                {CAFE.shift}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              aria-label="Mode Tamu"
              onClick={() => history.push("/tamu/beranda")}
              className="icon-btn glass-btn h-11 w-11 text-primary"
            >
              <Icon name="storefront" size={22} />
            </button>
            <button
              type="button"
              aria-label="Profil staf"
              onClick={openProfile}
              className="icon-btn glass-tint relative h-11 w-11 text-on-primary"
            >
              <Icon name="person" size={22} />
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </button>
          </div>
        </div>
      </div>
      <GlassSheet isOpen={glassOpen} onClose={() => setGlassOpen(false)} />
    </IonHeader>
  );
}
