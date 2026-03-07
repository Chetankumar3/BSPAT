import CategoryPanel from './CategoryPanel';
import MerchantPanel  from './MerchantPanel';

export default function Management({ categories, merchants, refresh }) {
  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-up">
      <CategoryPanel categories={categories} refresh={refresh} />
      <MerchantPanel merchants={merchants} categories={categories} refresh={refresh} />
    </div>
  );
}
