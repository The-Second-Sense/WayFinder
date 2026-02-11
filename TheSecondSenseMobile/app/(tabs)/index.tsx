import { registerRootComponent } from "expo";
import App from "./App"; // Acesta este fișierul unde ai NavigationContainer

// registerRootComponent se asigură că mediul este configurat corect
// și că componenta App este montată ca rădăcină a aplicației.
registerRootComponent(App);
