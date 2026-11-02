import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { GuestTabs, StaffTabs } from './tabs/Tabs';
import { NewMenuModal } from './components/NewMenuModal';
import Login from './pages/Login';

setupIonicReact({ mode: 'ios' });

function Routes() {
  const { session, isStaff } = useApp();
  // Admin mendarat di panel staf, pelanggan di beranda; belum masuk selalu ke /masuk
  const home = !session ? '/masuk' : isStaff ? '/staf/ringkasan' : '/tamu/beranda';
  return (
    <IonRouterOutlet>
      <Route exact path="/masuk" render={() => (session ? <Redirect to={home} /> : <Login />)} />
      <Route path="/tamu" render={() => (session ? <GuestTabs /> : <Redirect to="/masuk" />)} />
      <Route path="/staf" render={() => (isStaff ? <StaffTabs /> : <Redirect to={home} />)} />
      <Route exact path="/">
        <Redirect to={home} />
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
          <NewMenuModal />
        </IonReactRouter>
      </AppProvider>
    </IonApp>
  );
}
