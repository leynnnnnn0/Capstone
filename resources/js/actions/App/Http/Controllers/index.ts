import QuotationItemImageController from './QuotationItemImageController'
import HomePageController from './HomePageController'
import TrackingController from './TrackingController'
import ProductPageController from './ProductPageController'
import DashboardController from './DashboardController'
import AppointmentController from './AppointmentController'
import CalendarController from './CalendarController'
import ProductController from './ProductController'
import QuotationController from './QuotationController'
import WorkJobController from './WorkJobController'
import GetQuoteController from './GetQuoteController'
import Settings from './Settings'

const Controllers = {
    QuotationItemImageController: Object.assign(QuotationItemImageController, QuotationItemImageController),
    HomePageController: Object.assign(HomePageController, HomePageController),
    TrackingController: Object.assign(TrackingController, TrackingController),
    ProductPageController: Object.assign(ProductPageController, ProductPageController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    AppointmentController: Object.assign(AppointmentController, AppointmentController),
    CalendarController: Object.assign(CalendarController, CalendarController),
    ProductController: Object.assign(ProductController, ProductController),
    QuotationController: Object.assign(QuotationController, QuotationController),
    WorkJobController: Object.assign(WorkJobController, WorkJobController),
    GetQuoteController: Object.assign(GetQuoteController, GetQuoteController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers