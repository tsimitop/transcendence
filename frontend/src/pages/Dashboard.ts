// Import UI components
import Header from "../components/Header";
import Footer from "../components/Footer";

// Import base Component class and types for structured child handling
import Component, {
	ChildElementType,
	ChildrenStringType,
} from "../models/Component";

// Import current theme state (dark/light mode)
import themeState from "../context/ThemeContext";

// Define a new custom component class: Dashboard
// It extends from a base Component class for structured UI composition
class Dashboard extends Component
{
	// Constructor takes static HTML string + any number of child elements
	constructor(childrenString: ChildrenStringType, ...childElements: ChildElementType[]) 
	{
		super(childrenString, ...childElements); // Pass them to the base Component
	}

	// Static factory method to create and return a fully built Dashboard instance
	static create()
	{
		// Register the custom element (only once)
		if (!customElements.getName(Dashboard))
		{
			customElements.define("dashboard-component", Dashboard);
		}

		// Define the HTML markup for the main content of the dashboard
		const html = `
		<main class="main-container layout-padding theme-primary-${themeState.state}-full flex flex-col items-center space-y-4">
			<h1 class="text-2xl font-bold">Dashboard</h1>
		</main>
		`;

		// Create a new instance of the Dashboard
		const DashboardInstance = new Dashboard
		(
			{ html, position: "beforeend" }, // Insert this HTML at the end of the component
			{ element: Header.create(), position: "afterbegin" }, // Add Header at the top
			{ element: Footer.create(), position: "beforeend" },   // Add Footer at the bottom
		);

		// Insert child elements at their specified positions
		DashboardInstance.insertChildren();

		// Add an extra CSS class for page-level styling
		DashboardInstance.classList.add("page");

		// Return the fully built and configured instance
		return DashboardInstance;
	}
}

// Export the Dashboard so it can be used elsewhere
export default Dashboard;
