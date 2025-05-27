from cpih_json_exporter.fetcher import fetch_csv
from cpih_json_exporter.parser import parse_csv
from cpih_json_exporter.s3_uploader import upload_to_s3
from cpih_json_exporter.transformer import Transformer


def main():
    raw_stream = fetch_csv()
    cleaned_csv = parse_csv(raw_stream)
    json_str = Transformer(cleaned_csv).to_json()
    upload_to_s3(json_str)


if __name__ == "__main__":
    main()
