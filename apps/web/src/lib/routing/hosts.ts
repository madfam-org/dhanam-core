export function getHostnameFromHostHeader(hostHeader: string | null | undefined): string {
  const firstHost = hostHeader?.split(',')[0]?.trim() ?? '';

  if (!firstHost) {
    return '';
  }

  if (firstHost.startsWith('[')) {
    const closingBracketIndex = firstHost.indexOf(']');
    return closingBracketIndex === -1 ? firstHost : firstHost.slice(1, closingBracketIndex);
  }

  return firstHost.split(':')[0] ?? '';
}

export function getWwwApexRedirectUrl(
  requestUrl: string,
  hostHeader: string | null | undefined
): URL | null {
  const hostname = getHostnameFromHostHeader(hostHeader);

  if (!hostname.startsWith('www.')) {
    return null;
  }

  const url = new URL(requestUrl);
  const apexHostname = hostname.replace(/^www\./, '');

  url.hostname = apexHostname;
  url.port = '';

  if (apexHostname === 'localhost') {
    url.protocol = 'https:';
  }

  return url;
}
