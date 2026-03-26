import { gql } from "@apollo/client";

export const GET_SEAPORTS = gql`
  query GetSeaports($page: Int, $pageSize: Int, $search: String) {
    seaports(page: $page, pageSize: $pageSize, search: $search) {
      items {
        id
        portName
        locode
        latitude
        longitude
        timezoneOlson
        countryIso
        clientSource
        createdAt
        updatedAt
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

export const GET_SEAPORT = gql`
  query GetSeaport($locode: String!) {
    seaport(locode: $locode) {
      id
      portName
      locode
      latitude
      longitude
      timezoneOlson
      countryIso
      clientSource
      createdAt
      updatedAt
    }
  }
`;

export const GET_SEAPORT_COUNT = gql`
  query GetSeaportCount {
    seaportCount
  }
`;

export const SYNC_SEAPORTS = gql`
  mutation SyncSeaports {
    syncSeaports {
      totalRows
      validRows
      invalidRows
      upsertedRows
      errors {
        rowIndex
        reasons
      }
      duration
    }
  }
`;
