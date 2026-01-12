import { KenyanFormType, SuccessionRegime, SuccessionReligion } from '@prisma/client';

export interface LegalGuideProps {
  id: string;
  category: string;
  title: string;
  slug: string;
  summary: string;
  fullContent: string;
  appliesToRegime: SuccessionRegime[];
  appliesToReligion: SuccessionReligion[];
  legalSections: string[];
  relatedFormTypes: KenyanFormType[];
  relatedTasks: string[];
  keywords: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LegalGuide {
  private constructor(private props: LegalGuideProps) {}

  static create(
    category: string,
    title: string,
    summary: string,
    fullContent: string,
    appliesToRegime: SuccessionRegime[],
    appliesToReligion: SuccessionReligion[],
    legalSections: string[] = [],
    relatedFormTypes: KenyanFormType[] = [],
    relatedTasks: string[] = [],
    keywords: string[] = [],
  ): LegalGuide {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return new LegalGuide({
      id: crypto.randomUUID(),
      category,
      title,
      slug,
      summary,
      fullContent,
      appliesToRegime,
      appliesToReligion,
      legalSections,
      relatedFormTypes,
      relatedTasks,
      keywords,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: LegalGuideProps): LegalGuide {
    return new LegalGuide(props);
  }

  incrementViewCount(): void {
    this.props.viewCount += 1;
    this.props.updatedAt = new Date();
  }

  toJSON(): LegalGuideProps {
    return { ...this.props };
  }
}
