from cpihcsv2json.fetcher import fetch_csv
from cpihcsv2json.parser import parse_csv
from cpihcsv2json.transformer import Transformer


def main():
    raw_stream = fetch_csv()
    cleaned_csv = parse_csv(raw_stream)
    print(Transformer(cleaned_csv).to_json())


if __name__ == "__main__":
    main()
