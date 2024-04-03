import json
import os
from datetime import datetime

def prepare_data_for_json_lines(data, price_type):
    if not data:
        return None, None

    if 'PriceTimeStamp' in data[0]:
        start_time = datetime.utcfromtimestamp(data[0]['PriceTimeStamp']).strftime('%Y-%m-%d %H:%M:%S')  # Removed timezone info
    else:
        print("Warning: 'PriceTimeStamp' is missing in the first record.")
        return None, None

    target = [record.get(price_type, None) for record in data if price_type in record]

    return start_time, target

def write_to_jsonl(file_path, start, target):
    with open(file_path, 'w') as file:
        series_data = {"start": start, "target": target}
        file.write(json.dumps(series_data) + '\n')

def process_data(input_file_path, output_folder, price_type, is_trim=False, num_points_to_trim=100):
    with open(input_file_path, 'r') as file:
        data = json.load(file)

    if is_trim:
        data = data[:-num_points_to_trim] if len(data) > num_points_to_trim else data

    start, target = prepare_data_for_json_lines(data, price_type)

    if start and target:
        base_name = os.path.basename(input_file_path)
        new_name = f"{price_type}_{base_name.replace('.json', '')}_{('Train' if is_trim else 'Test')}.jsonl"
        output_file_path = os.path.join(output_folder, new_name)

        write_to_jsonl(output_file_path, start, target)
        print(f"{price_type} data processed and saved to: {output_file_path}")
    else:
        print(f"No valid data to process in {input_file_path} for {price_type}")

if __name__ == "__main__":
    print(f"Current working directory: {os.getcwd()}")

    main_folder_path = os.path.join(os.getcwd(), 'Machine_Learning', 'Actual_Data')
    price_types = ['Close', 'Low', 'High', 'Open']
    currencies = ['ADA', 'BTC', 'ETH', 'LTC', 'XRP']

    for currency in currencies:
        currency_folder_path = os.path.join(main_folder_path, currency)
        data_file_path = os.path.join(currency_folder_path, f"{currency}_Test.json")

        if os.path.exists(data_file_path):
            for price_type in price_types:
                process_data(data_file_path, currency_folder_path, price_type, is_trim=True, num_points_to_trim=100)  # Train
                process_data(data_file_path, currency_folder_path, price_type, is_trim=False)  # Test
        else:
            print(f"Data file does not exist: {data_file_path}")
