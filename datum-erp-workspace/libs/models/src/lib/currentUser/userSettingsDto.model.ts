export interface Setting {
  Key: string;
  Value: string;
}
export class UserSettingDto implements Setting {
  Key: string;
  Value: string;

  constructor(data: Setting) {
    this.Key = data.Key;
    this.Value = data.Value;
  }
}