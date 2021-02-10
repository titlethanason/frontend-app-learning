import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import PageLoading from '../generic/PageLoading';

import messages from './messages';
import { loadDynamicScript, loadScriptComponent } from './utils';

export const COMPONENT = 'component';
export const SCRIPT = 'script';
export const IFRAME = 'iframe';

const useDynamicScript = (url) => {
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [element, setElement] = React.useState(null);
  React.useEffect(() => {
    if (!url) {
      return () => {};
    }

    setReady(false);
    setFailed(false);

    loadDynamicScript(url).then((el) => {
      setElement(el);
      setReady(true);
    }).catch(() => {
      setReady(false);
      setFailed(true);
    });

    return () => {
      document.head.removeChild(element);
    };
  }, [url]);

  return {
    ready,
    failed,
  };
};

function Plugin({ plugin, intl }) {
  const url = plugin ? plugin.url : null;
  const { ready, failed } = useDynamicScript(url);

  if (!plugin) {
    return null;
  }

  if (!ready) {
    return (
      <PageLoading
        srMessage={intl.formatMessage(messages.loading)}
      />
    );
  }

  if (failed) {
    return null;
  }

  const PluginComponent = React.lazy(
    loadScriptComponent(plugin.scope, plugin.module),
  );

  return (
    <Suspense
      fallback={(
        <PageLoading
          srMessage={intl.formatMessage(messages.loading)}
        />
      )}
    >
      <PluginComponent />
    </Suspense>
  );
}

Plugin.propTypes = {
  plugin: PropTypes.shape({
    scope: PropTypes.string.isRequired,
    module: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    type: PropTypes.oneOf([COMPONENT, SCRIPT, IFRAME]).isRequired,
  }),
  intl: intlShape.isRequired,
};

Plugin.defaultProps = {
  plugin: null,
};

export default injectIntl(Plugin);