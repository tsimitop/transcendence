import Home from "./pages/Home";
// import Login from "./pages/Login";

const renderApp = function (): void {
  const root = document.getElementById("root")!;
  const HomeInstance = Home.create();
  // const LoginInstance = Login.create();
  root.append(HomeInstance);
  // root.append(LoginInstance);
};

renderApp();
