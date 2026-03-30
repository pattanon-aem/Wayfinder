// Transport-related TypeScript types

export interface BusArrival {
  ServiceNo: string;
  Operator: string;
  NextBus: BusInfo;
  NextBus2: BusInfo;
  NextBus3: BusInfo;
}

export interface BusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string;
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: string;
  Feature: string;
  Type: string;
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

export interface BusService {
  ServiceNo: string;
  Operator: string;
  Direction: number;
  Category: string;
  OriginCode: string;
  DestinationCode: string;
  AM_Peak_Freq: string;
  AM_Offpeak_Freq: string;
  PM_Peak_Freq: string;
  PM_Offpeak_Freq: string;
  LoopDesc: string;
}

export interface BusRoute {
  ServiceNo: string;
  Operator: string;
  Direction: number;
  StopSequence: number;
  BusStopCode: string;
  Distance: number;
  WD_FirstBus: string;
  WD_LastBus: string;
  SAT_FirstBus: string;
  SAT_LastBus: string;
  SUN_FirstBus: string;
  SUN_LastBus: string;
}

export interface Carpark {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string;
  AvailableLots: number;
  LotType: string;
  Agency: string;
}

export interface Taxi {
  Latitude: number;
  Longitude: number;
  LastUpdate: string;
}

export interface TrafficIncident {
  Type: string;
  Latitude: number;
  Longitude: number;
  Message: string;
}

export interface TravelTime {
  StartPoint: string;
  EndPoint: string;
  EstimatedTime: number;
}

export interface ERPRate {
  ZoneID: string;
  VehicleType: string;
  DayType: string;
  StartTime: string;
  EndTime: string;
  ChargeAmount: number;
}

export interface RoadWork {
  EventID: string;
  StartDate: string;
  EndDate: string;
  Location: string;
  Message: string;
  Latitude: number;
  Longitude: number;
}

export interface PassengerVolume {
  Origin: string;
  Destination: string;
  TotalTrips: number;
  TimeInterval: string;
}

export interface TaxiStand {
  TaxiCode: string;
  Latitude: number;
  Longitude: number;
  Bfa: string;
  Ownership: string;
  Type: string;
  Name: string;
}
