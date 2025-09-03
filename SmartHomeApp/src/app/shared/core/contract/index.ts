export interface BusinessUtils<BUSINESS, DTO> {
  getEmpty(): BUSINESS;

  toDTO(business:BUSINESS): DTO;

  fromDTO(dto:DTO): BUSINESS;
}
