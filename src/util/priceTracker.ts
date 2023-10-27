import { Vendor } from "../services/PriceTrackerService";

export const VendorToString = (vendor: Vendor): string => {
  switch(vendor) {
    case Vendor.GLOBAL_DATA:
      return "GlobalData";
    case Vendor.PCDIGA:
      return "PcDiga";
    default:
      return "Unknown Vendor";
  }
}