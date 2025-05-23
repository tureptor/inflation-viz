from transformer import Transformer
from parser import parse_csv
from fetcher import fetch_csv


def main():
    raw_stream = fetch_csv()
    cleaned_csv = parse_csv(raw_stream)
    print(Transformer().run(cleaned_csv))


if __name__ == "__main__":
    main()
