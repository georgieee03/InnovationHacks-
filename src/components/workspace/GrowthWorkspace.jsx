import { useContext, useEffect, useState } from 'react';
import { TrendingUp, Sparkles, RefreshCcw } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import RippleButton from '../shared/RippleButton';

export default function GrowthWorkspace() {
  const { businessInfo } = useContext(AppContext);
  const [workspace, setWorkspace] = useState({ funding: [], actions: [], tinyFishConfigured: false, source: 'fallback' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!businessInfo?.id) {
      setWorkspace({ funding: [], actions: [], tinyFishConfigured: false, source: 'fallback' });
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.getGrowthWorkspace()
      .then((payload) => {
        if (active) {
          setWorkspace(payload || { funding: [], actions: [] });
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Failed to load growth workspace');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [businessInfo?.id]);

  const refreshFunding = async () => {
    setRefreshing(true);
    setError('');

    try {
      const payload = await api.refreshGrowthWorkspace();
      setWorkspace((current) => ({ ...current, ...payload }));
    } catch (refreshError) {
      setError(refreshError.message || 'Failed to refresh funding opportunities');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="surface-panel-strong rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Growth</p>
            <h2 className="mt-3 text-3xl font-heading font-light tracking-[-0.03em] text-text-primary">Funding and operating next steps from one profile</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
              Growth combines LaunchPad&apos;s funding view with SafeGuard&apos;s operating context. Until TinyFish is configured, this branch serves heuristic opportunities that still keep the workflow deployable.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="surface-panel rounded-3xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-secondary">Funding source</p>
              <p className="mt-2 text-sm text-text-primary">{workspace.tinyFishConfigured ? 'TinyFish enabled' : 'Fallback mode'}</p>
            </div>
            <RippleButton type="button" variant="secondary" size="md" onClick={() => void refreshFunding()} disabled={refreshing}>
              <RefreshCcw className="h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh funding'}
            </RippleButton>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-gap">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Funding opportunities</p>
              <p className="mt-1 text-sm text-text-secondary">Heuristic recommendations now, live TinyFish search later.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-text-secondary">Loading funding workspace...</p>
          ) : workspace.funding?.length ? (
            <div className="mt-6 grid gap-3">
              {workspace.funding.map((item) => (
                <article key={item.id} className="surface-panel rounded-3xl p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">{item.provider} · {item.type}</p>
                      <p className="mt-3 text-sm leading-6 text-text-secondary">{item.recommendation}</p>
                    </div>
                    <div className="text-sm text-text-secondary lg:text-right">
                      <p>{formatCurrency(Number(item.amount_min || 0))} - {formatCurrency(Number(item.amount_max || 0))}</p>
                      <p className="mt-1">Fit score {item.fit_score}</p>
                      {item.application_url ? (
                        <a href={item.application_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-primary transition-colors hover:text-primary/80">
                          Open application
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-text-secondary">No funding opportunities are available yet.</p>
          )}
        </div>

        <div className="surface-panel rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Recommended actions</p>
              <p className="mt-1 text-sm text-text-secondary">These operational prompts are derived from onboarding and the active workspace.</p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-text-secondary">Loading action plan...</p>
          ) : workspace.actions?.length ? (
            <div className="mt-6 grid gap-3">
              {workspace.actions.map((action) => (
                <article key={action.id} className="surface-panel rounded-3xl p-4">
                  <p className="text-sm font-medium text-text-primary">{action.title}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{action.reasoning}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-text-secondary">
                    <span>{action.type}</span>
                    <span>{action.impact}</span>
                    <span>{action.urgency}</span>
                    <span>{action.effort}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-text-secondary">No growth actions are available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
