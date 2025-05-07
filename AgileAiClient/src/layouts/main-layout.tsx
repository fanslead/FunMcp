import DesktopPage from './(desktop)';
import AdaptiveLayout from './adaptive-layout';

export default function MainLayout() {
    return <AdaptiveLayout DesktopPage={DesktopPage} />;
}