import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { GuestTabs, StaffTabs } from './tabs/Tabs';
import { PinModal } from './components/PinModal';
import { NewMenuModal } from './components/NewMenuModal';

setupIonicReact({ mode: 'ios' });

function Routes() {
  const { isStaff } = useApp();
  return (
    <IonRouterOutlet>
      <Route path="/tamu" render={() => <GuestTabs />} />
      <Route path="/staf" render={() => (isStaff ? <StaffTabs /> : <Redirect to="/tamu/beranda" />)} />
      <Route exact path="/">
        <Redirect to="/tamu/beranda" />
      </Route>
    </IonRouterOutlet>
  );
}

export default function App() {
  return (
    <IonApp>
      <AppProvider>
        <IonReactRouter>
          <Routes />
          <PinModal />
          <NewMenuModal />
        </IonReactRouter>
      </AppProvider>
    </IonApp>
  );
}
