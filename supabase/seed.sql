insert into public.menu_categories (name, description, sort_order) values
  ('Salan', 'Daily curry and gravy items', 1),
  ('Karahi', 'Chicken and mutton karahi', 2),
  ('Rice', 'Biryani, pulao, and plain rice', 3),
  ('Bread', 'Roti and naan', 4),
  ('Drinks', 'Cold drinks and water', 5),
  ('Tea', 'Hot tea service', 6),
  ('Extras', 'Sides and service items', 7)
on conflict (name) do nothing;

insert into public.menu_items (category_id, name, selling_price, cost_price, current_stock, minimum_stock, status)
select c.id, v.name, v.selling_price, v.cost_price, v.current_stock, v.minimum_stock, 'available'::public.item_status
from (
  values
    ('Karahi', 'Chicken Karahi', 1200, 760, 18, 6),
    ('Karahi', 'Mutton Karahi', 1800, 1180, 8, 5),
    ('Salan', 'Daal', 220, 95, 35, 10),
    ('Salan', 'White Chana', 260, 120, 24, 8),
    ('Salan', 'Nihari', 520, 310, 11, 6),
    ('Rice', 'Biryani', 420, 235, 45, 12),
    ('Rice', 'Pulao', 380, 210, 21, 8),
    ('Salan', 'Salan Plate', 300, 150, 30, 10),
    ('Bread', 'Roti', 30, 12, 140, 40),
    ('Bread', 'Naan', 60, 24, 65, 25),
    ('Tea', 'Tea', 120, 45, 70, 20),
    ('Drinks', 'Soft Drinks', 150, 95, 36, 15),
    ('Drinks', 'Water', 80, 45, 48, 20),
    ('Extras', 'Salad', 100, 38, 16, 8),
    ('Extras', 'Extra Plate', 50, 8, 90, 25)
) as v(category_name, name, selling_price, cost_price, current_stock, minimum_stock)
join public.menu_categories c on c.name = v.category_name
on conflict (category_id, name) do nothing;

insert into public.settings (key, value) values
  ('restaurant_profile', '{"name":"Karahi POS Restaurant","phone":"+92 300 0000000","address":"Main Bazaar, Lahore"}'),
  ('sales', '{"tax_enabled":false,"default_tax_rate":0,"currency":"PKR"}')
on conflict (key) do update set value = excluded.value;
