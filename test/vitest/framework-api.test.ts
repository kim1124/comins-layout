import { describe, expect, it } from 'vitest';
import { apiForFramework } from '../../example/src/shared/framework-api';
import { apiFeatures } from '../../example/src/docs/content';
describe('selected framework API contracts', () => {
  it('keeps composable callbacks but converts renderer callbacks and slots without changing the React catalog', () => {
    const renderer = apiFeatures[0]!;
    const vue = apiForFramework(renderer, 'vue');
    expect(vue.props.find(prop => prop.name === 'default slot')?.type).toContain('widget: DashboardWidget<TData>');
    expect(vue.props.find(prop => prop.name === 'default slot')?.detail).not.toContain('ReactNode');
    expect(apiForFramework(renderer, 'react').props.find(prop => prop.name === 'renderWidget')).toBeDefined();
    const persistence = apiFeatures.find(section => section.id === 'api-layout-save-restore')!;
    const vuePersistence = apiForFramework(persistence, 'vue');
    expect(vuePersistence.props.map(prop => prop.name)).toContain('layoutCommit');
    expect(vuePersistence.props.map(prop => prop.name)).toContain('onLayoutMutation');
    expect(persistence.props.map(prop => prop.name)).toContain('onLayoutCommit');
  });
});
