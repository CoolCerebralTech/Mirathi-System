export interface FormPreviewProps {
  id: string;
  probatePreviewId: string;
  formType: string;
  formTitle: string;
  formCode: string;
  htmlPreview: string;
  dataSnapshot: any;
  purpose: string;
  legalBasis?: string;
  instructions: string[];
  missingFields: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class FormPreview {
  private constructor(private props: FormPreviewProps) {}

  static create(
    probatePreviewId: string,
    formType: string,
    formTitle: string,
    formCode: string,
    htmlPreview: string,
    dataSnapshot: any,
  ): FormPreview {
    return new FormPreview({
      id: crypto.randomUUID(),
      probatePreviewId,
      formType,
      formTitle,
      formCode,
      htmlPreview,
      dataSnapshot,
      purpose: '',
      instructions: [],
      missingFields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: FormPreviewProps): FormPreview {
    return new FormPreview(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get htmlPreview(): string {
    return this.props.htmlPreview;
  }

  toJSON(): FormPreviewProps {
    return { ...this.props };
  }
}
