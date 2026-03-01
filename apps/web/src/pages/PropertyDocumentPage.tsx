import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type PropertyDetail = {
  propertyName: string;
  propertyType?: { listName: string } | null;
  propertyStatus?: { listName: string } | null;
  identifierCode: string;
  propertyOwnership?: { listName: string } | null;
  description: string | null;
  documentUrl: string | null;
  extraData: {
    id: number;
    propertyAttribute: { attributeName: string };
    attributeAnswerText: string | null;
    attributeAnswer?: { answer?: { listName: string } | null } | null;
  }[];
};

export function PropertyDocumentPage() {
  const params = useParams();
  const { data } = useQuery({
    queryKey: ['property-document', params.id],
    queryFn: () => apiRequest<PropertyDetail>(`/properties/${params.id}`),
  });

  return (
    <>
      <PageHeader title={`Property Details: ${data?.propertyName ?? ''}`} />
      <div className="surface" style={{ padding: '1.5rem' }}>
        <div className="card-grid">
          <div>
            <p>
              <strong>Property Type:</strong> {data?.propertyType?.listName ?? '-'}
            </p>
            <p>
              <strong>Status:</strong> {data?.propertyStatus?.listName ?? '-'}
            </p>
            <p>
              <strong>Identifier Code:</strong> {data?.identifierCode ?? '-'}
            </p>
            <p>
              <strong>Ownership Type:</strong> {data?.propertyOwnership?.listName ?? '-'}
            </p>
            <p>
              <strong>Description:</strong> {data?.description ?? '-'}
            </p>
            <h3>Extra Attributes</h3>
            {(data?.extraData ?? []).map((item) => (
              <p key={item.id}>
                <strong>{item.propertyAttribute.attributeName}:</strong>{' '}
                {item.attributeAnswerText ?? item.attributeAnswer?.answer?.listName ?? '-'}
              </p>
            ))}
          </div>
          <div>
            {data?.documentUrl ? <img className="property-image" src={data.documentUrl} alt={data.propertyName} /> : <div className="property-image" />}
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <Link className="button secondary" to="/property/index">
            Back to List
          </Link>
        </div>
      </div>
    </>
  );
}
