from collections.abc import Iterator

import requests


def fetch_csv() -> Iterator[str]:
    """
    Fetch CPI(H) CSV from ONS as a line iterator.
    Returns:
        Iterator[str]: An iterator over the CSV lines.
    """

    url: str = "https://www.ons.gov.uk/file?uri=/economy/inflationandpriceindices/datasets/consumerpriceindices/current/mm23.csv"
    response = requests.get(url, stream=True)
    response.raise_for_status()
    return response.iter_lines(decode_unicode=True)
