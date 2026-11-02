import { IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { Icon } from '../components/ui';
import Home from '../pages/guest/Home';
import Menu from '../pages/guest/Menu';
import LiveMusic from '../pages/guest/LiveMusic';
import TablesPage from '../pages/shared/TablesPage';
import Dashboard from '../pages/staff/Dashboard';
import Stock from '../pages/staff/Stock';
import StaffLive from '../pages/staff/StaffLive';

const GuestTables = () => <TablesPage />;
const StaffTables = () => <TablesPage staff />;

const TAB_ICON = 'tab-icon';

export function GuestTabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tamu/beranda" component={Home} />
        <Route exact path="/tamu/meja" component={GuestTables} />
        <Route exact path="/tamu/menu" component={Menu} />
        <Route exact path="/tamu/live-music" component={LiveMusic} />
        <Route exact path="/tamu">
          <Redirect to="/tamu/beranda" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="beranda" href="/tamu/beranda">
          <Icon name="storefront" size={24} className={TAB_ICON} />
          <IonLabel>Beranda</IonLabel>
        </IonTabButton>
        <IonTabButton tab="meja" href="/tamu/meja">
          <Icon name="table_restaurant" size={24} className={TAB_ICON} />
          <IonLabel>Meja</IonLabel>
        </IonTabButton>
        <IonTabButton tab="menu" href="/tamu/menu">
          <Icon name="coffee" size={24} className={TAB_ICON} />
          <IonLabel>Menu</IonLabel>
        </IonTabButton>
        <IonTabButton tab="live-music" href="/tamu/live-music">
          <Icon name="music_note" size={24} className={TAB_ICON} />
          <IonLabel>Live Music</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export function StaffTabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/staf/ringkasan" component={Dashboard} />
        <Route exact path="/staf/meja" component={StaffTables} />
        <Route exact path="/staf/stok" component={Stock} />
        <Route exact path="/staf/live-music" component={StaffLive} />
        <Route exact path="/staf">
          <Redirect to="/staf/ringkasan" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="ringkasan" href="/staf/ringkasan">
          <Icon name="dashboard" size={24} className={TAB_ICON} />
          <IonLabel>Ringkasan</IonLabel>
        </IonTabButton>
        <IonTabButton tab="kelola-meja" href="/staf/meja">
          <Icon name="table_restaurant" size={24} className={TAB_ICON} />
          <IonLabel>Kelola Meja</IonLabel>
        </IonTabButton>
        <IonTabButton tab="stok" href="/staf/stok">
          <Icon name="inventory_2" size={24} className={TAB_ICON} />
          <IonLabel>Stok &amp; Menu</IonLabel>
        </IonTabButton>
        <IonTabButton tab="staf-live" href="/staf/live-music">
          <Icon name="mic" size={24} className={TAB_ICON} />
          <IonLabel>Live Music</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
