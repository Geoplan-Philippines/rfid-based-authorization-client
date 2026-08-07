import { rfidTagStatusTag } from './status-tags';

describe('rfidTagStatusTag', () => {
  it('can scope the operational status to the RFID tag', () => {
    expect(rfidTagStatusTag('ACTIVE', 'tag')).toEqual({
      label: 'Tag: Active',
      severity: 'success',
    });
  });
});
