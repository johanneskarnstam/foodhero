import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { HomeView } from './components/HomeView'
import { GroceryListView } from './components/GroceryListView'
import { MealPlanView } from './components/MealPlanView'
import { TodoView } from './components/TodoView'
import { ActivityLog } from './components/ActivityLog'
import { StatisticsView } from './components/StatisticsView'
import { SettingsView } from './components/SettingsView'
import { HistoryView } from './components/HistoryView'
import { MealsView } from './components/MealsView'
import { IngredientSearchView } from './components/IngredientSearchView'
import { DebugView } from './components/DebugView'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create the router configuration
const router = createHashRouter([
    {
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "/",
                element: <HomeView />,
            },
            {
                path: "/shopping",
                element: <GroceryListView />,
            },
            {
                path: "/todos",
                element: <TodoView />,
            },
            {
                path: "/mealplan", 
                element: <MealPlanView />
            },
            {
                path: "/activity",
                element: <ActivityLog />,
            },
            {
                path: "/statistics",
                element: <StatisticsView />,
            },
            {
                path: "/history",
                element: <HistoryView />,
            },
            {
                path: "/meals",
                element: <MealsView />,
            },
            {
                path: "/ingredients",
                element: <IngredientSearchView />,
            },
            {
                path: "/settings",
                element: <SettingsView />,
            },
            {
                path: "/debug",
                element: <DebugView />,
            },
        ],
    },
]);

function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <AppProvider>
                        <RouterProvider router={router} />
                    </AppProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App
