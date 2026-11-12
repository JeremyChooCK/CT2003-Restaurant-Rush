package restaurantrush.boundary;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayDeque;
import java.util.Set;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import javax.imageio.ImageIO;
import javax.swing.*;
import restaurantrush.control.Game;
import restaurantrush.entity.ComboMeal;
import restaurantrush.entity.Customer;
import restaurantrush.entity.CustomerStatus;
import restaurantrush.entity.MenuItem;
import restaurantrush.entity.Order;
import restaurantrush.entity.OrderStatus;
import restaurantrush.entity.Table;

/**
 * Paints the dining room from the current game state.
 * <p>
 * The room only reads the {@link Game}: customers walk to the queue or their
 * table according to their status, and staff sprites walk short routes to
 * animate the actions {@link PixelGame} has already applied. It never changes
 * the game, so animations cannot affect the rules.
 */
final class PixelRoom extends JPanel {
    private static final int WIDTH = 300;
    private static final int HEIGHT = 232;
    private static final Color INK = new Color(0x302638);
    private static final Color CREAM = new Color(0xffedcb);
    private final Map<String, BufferedImage> art = new HashMap<>();
    private static final Point ENTRANCE = new Point(24, 182);
    private static final long STEP_MS = 16;
    private final Map<Integer, Walker> customers = new LinkedHashMap<>();
    private final Walker host = new Walker(new Point(85, 182));
    private final Walker waiter = new Walker(new Point(188, 178));
    private final Walker chef = new Walker(new Point(72, 8));
    private final Walker cashier = new Walker(new Point(245, 7));
    private final Timer animation = new Timer((int) STEP_MS, event -> advanceFrame());
    private final Map<Integer, Order> pendingDeliveries = new LinkedHashMap<>();
    private Order carriedOrder;
    private Walker paymentCustomer;
    private int orderAwaitingHandoff;
    private boolean carryingTicket;
    private double showDeliveredTicketUntil;
    private Game game;
    private long lastFrame;
    private double sceneTime;

    private record Stop(Point point, Runnable onArrival) {
        Stop(Point point) {
            this(point, null);
        }
    }

    /** A sprite follows queued waypoints in screen space. */
    private static final class Walker {
        final Point home;
        final ArrayDeque<Stop> route = new ArrayDeque<>();
        double x;
        double y;
        double stride;
        int horizontalFacing;
        Point destination;
        Customer customer;
        boolean leaving;

        Walker(Point home) {
            this.home = home;
            destination = home;
            x = home.x;
            y = home.y;
        }

        void walk(Point... points) {
            route.clear();
            for (Point point : points) route.add(new Stop(point));
            destination = route.getLast().point();
        }

        void advance(double elapsed) {
            double distance = elapsed * 150;
            while (!route.isEmpty()) {
                Stop stop = route.peek();
                Point target = stop.point();
                double dx = target.x - x;
                double dy = target.y - y;
                double step = 0;
                if (dx != 0) {
                    step = Math.min(distance, Math.abs(dx));
                    horizontalFacing = dx < 0 ? -1 : 1;
                    x = step == Math.abs(dx) ? target.x : x + horizontalFacing * step;
                } else if (dy != 0) {
                    step = Math.min(distance, Math.abs(dy));
                    horizontalFacing = 0;
                    y = step == Math.abs(dy) ? target.y : y + Math.copySign(step, dy);
                }
                stride += step;
                if (x == target.x && y == target.y) {
                    route.remove();
                    if (stop.onArrival() != null) stop.onArrival().run();
                }
                // Start the next leg on a new frame so turns stay square.
                if (dx != 0 || dy != 0) return;
            }
        }

        int x() { return (int) Math.round(x); }
        int y() { return (int) Math.round(y); }
    }

    /**
     * Loads every sprite from {@code assets/img}.
     *
     * @throws IOException if a sprite is missing or unreadable
     */
    PixelRoom() throws IOException {
        setPreferredSize(new Dimension(WIDTH * 2, HEIGHT * 2));
        setBackground(INK);
        String[] files = {"restaurant", "regular", "vip", "critic", "waiter", "chef", "cashier",
            "host", "queue", "salad", "pasta", "burger", "table-free", "table-occupied",
            "kitchen", "entrance", "plant"};
        for (String name : files) load(name);
        for (String character : new String[]{"regular", "vip", "critic", "waiter", "chef", "cashier", "host"}) {
            load(character + "-walk-1");
            load(character + "-walk-2");
            load(character + "-side-1");
            load(character + "-side-2");
        }
    }

    private void load(String name) throws IOException {
        Path file = Path.of("assets", "img", name + ".png");
        BufferedImage image = ImageIO.read(file.toFile());
        if (image == null) throw new IOException("Invalid sprite: " + file);
        art.put(name, image);
    }

    @Override
    public void addNotify() {
        super.addNotify();
        lastFrame = System.nanoTime();
        animation.start();
    }

    @Override
    public void removeNotify() {
        animation.stop();
        super.removeNotify();
    }

    private void advanceFrame() {
        long now = System.nanoTime();
        double elapsed = Math.min(0.05, (now - lastFrame) / 1_000_000_000.0);
        lastFrame = now;
        sceneTime += elapsed;
        for (Walker walker : customers.values()) walker.advance(elapsed);
        customers.values().removeIf(walker -> walker.leaving && walker.route.isEmpty());
        host.advance(elapsed);
        waiter.advance(elapsed);
        chef.advance(elapsed);
        cashier.advance(elapsed);
        repaint();
    }

    /**
     * Tells whether the Cashier is still walking to collect a payment.
     *
     * @return {@code true} while a payment is being animated
     */
    boolean hasPendingPayment() {
        return paymentCustomer != null;
    }

    /**
     * Moves the sprites to match the game. A different {@code Game} object
     * (a new game or a demo jump) clears every sprite and animation first.
     *
     * @param game            the game to draw
     * @param onCashierReturn called when the Cashier returns from a payment
     */
    void showGame(Game game, Runnable onCashierReturn) {
        if (this.game != game) {
            customers.clear();
            paymentCustomer = null;
            pendingDeliveries.clear();
            orderAwaitingHandoff = 0;
            carryingTicket = false;
            showDeliveredTicketUntil = 0;
            carriedOrder = null;
            for (Walker staff : new Walker[]{host, waiter, chef, cashier}) {
                staff.x = staff.home.x;
                staff.y = staff.home.y;
                staff.route.clear();
            }
        }
        this.game = game;
        Set<Integer> visible = new HashSet<>();
        var queue = game.getRestaurant().getWaitingQueue();
        for (int i = 0; i < queue.size(); i++) {
            updateCustomer(queue.get(i), new Point(15 + i % 2 * 32, 91 + i / 2 * 29), visible, false);
        }
        for (Table table : game.getRestaurant().getTables()) {
            if (!table.isFree()) {
                updateCustomer(table.getOccupant(), new Point(tableX(table.getNumber()) + 5, 83), visible, true);
            }
        }
        for (Walker walker : customers.values()) {
            if (visible.contains(walker.customer.getId()) || walker.leaving || walker == paymentCustomer) {
                continue;
            }
            if (walker.customer.getStatus() == CustomerStatus.PAID) {
                paymentCustomer = walker;
                cashier.route.add(new Stop(new Point(walker.destination.x, 58)));
                cashier.route.add(new Stop(cashier.home, () -> {
                    paymentCustomer = null;
                    sendToExit(walker);
                    onCashierReturn.run();
                }));
            } else {
                sendToExit(walker);
            }
        }
        repaint();
    }

    private void sendToExit(Walker walker) {
        walker.leaving = true;
        if (walker.x() > 82) {
            walker.walk(new Point(walker.x(), 63), new Point(61, 63), new Point(61, 180), ENTRANCE);
        } else {
            walker.walk(new Point(61, 180), ENTRANCE);
        }
    }

    private void updateCustomer(Customer customer, Point destination, Set<Integer> visible, boolean seated) {
        visible.add(customer.getId());
        Walker walker = customers.computeIfAbsent(customer.getId(), id -> new Walker(ENTRANCE));
        walker.customer = customer;
        if (!walker.destination.equals(destination)) {
            if (seated) {
                walker.walk(new Point(58, 64), new Point(destination.x, 64), destination);
            } else if (walker.destination.equals(ENTRANCE)) {
                walker.walk(new Point(58, 174), new Point(58, destination.y), destination);
            } else {
                walker.walk(destination);
            }
        }
    }

    /**
     * Animates the Host or Waiter walking to a table to seat a customer.
     *
     * @param useHost     {@code true} for the Host, {@code false} for the Waiter
     * @param tableNumber the table, starting at 1
     */
    void staffVisitsTable(boolean useHost, int tableNumber) {
        Walker staff = useHost ? host : waiter;
        int x = tableX(tableNumber) + 60;
        staff.route.add(new Stop(new Point(x, 176)));
        staff.route.add(new Stop(new Point(x, 145)));
        staff.route.add(new Stop(new Point(x, 176)));
        staff.route.add(new Stop(staff.home));
    }

    /**
     * Tells whether the Waiter is still carrying a new order to the Chef.
     *
     * @return {@code true} while a ticket is being animated
     */
    boolean hasPendingTicket() {
        return orderAwaitingHandoff != 0;
    }

    /**
     * Animates the Waiter taking an order ticket from a table to the Chef.
     *
     * @param order       the order just taken
     * @param tableNumber the customer's table
     * @param onHandoff   called when the ticket reaches the Chef
     */
    void bringOrderToChef(Order order, int tableNumber, Runnable onHandoff) {
        orderAwaitingHandoff = order.getId();
        Point aisle = new Point(162, 61);
        Point table = new Point(tableX(tableNumber) + 49, 84);
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(table, () -> carryingTicket = true));
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(new Point(96, 21), () -> {
            carryingTicket = false;
            orderAwaitingHandoff = 0;
            showDeliveredTicketUntil = sceneTime + 0.8;
            onHandoff.run();
        }));
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(waiter.home));
    }

    /**
     * Tells whether a served dish is still being carried to its table.
     *
     * @return {@code true} while a delivery is being animated
     */
    boolean hasPendingDelivery() {
        return !pendingDeliveries.isEmpty();
    }

    private String orderInTransit(Order order) {
        if (order.getId() == orderAwaitingHandoff) return "ORDER TO CHEF";
        if (order == carriedOrder) return "ON THE WAY";
        return pendingDeliveries.containsKey(order.getId()) ? "READY / PICKUP" : "";
    }

    /**
     * Animates the Waiter carrying a served dish from the pickup counter to a table.
     *
     * @param order       the order just served
     * @param tableNumber the customer's table
     * @param onDelivery  called when the dish reaches the table
     */
    void deliverOrder(Order order, int tableNumber, Runnable onDelivery) {
        pendingDeliveries.put(order.getId(), order);
        Point aisle = new Point(162, 61);
        Point table = new Point(tableX(tableNumber) + 49, 84);
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(new Point(105, 20), () -> carriedOrder = order));
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(table, () -> {
            pendingDeliveries.remove(order.getId());
            carriedOrder = null;
            onDelivery.run();
        }));
        waiter.route.add(new Stop(aisle));
        waiter.route.add(new Stop(waiter.home));
    }

    /** Animates the Chef stepping to the stove for one preparation unit. */
    void chefCooks() {
        chef.walk(new Point(52, 12), new Point(49, 7), chef.home);
    }

    private static int tableX(int number) {
        return 93 + (number - 1) * 102;
    }

    /**
     * Returns a loaded sprite as a Swing icon.
     *
     * @param name the sprite name, such as "burger"
     * @return the icon
     */
    Icon icon(String name) {
        return new ImageIcon(art.get(name));
    }

    @Override
    protected void paintComponent(Graphics graphics) {
        super.paintComponent(graphics);
        if (game == null) return;
        Graphics2D g = (Graphics2D) graphics.create();
        double scale = Math.min((double) getWidth() / WIDTH, (double) getHeight() / HEIGHT);
        g.translate((getWidth() - WIDTH * scale) / 2, (getHeight() - HEIGHT * scale) / 2);
        g.scale(scale, scale);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 8));
        sprite(g, "restaurant", 0, 0, WIDTH, HEIGHT);
        sprite(g, "kitchen", 13, 5, 58, 48);
        drawPickupCounter(g);
        drawOrderBox(g);
        drawStaff(g, "chef", chef, 35);
        badge(g, "CHEF", 72, 45);
        if (sceneTime < showDeliveredTicketUntil) ticket(g, 101, 29);
        drawStaff(g, "cashier", cashier, 35);
        badge(g, "CASHIER / AUTO", 219, 45);
        sprite(g, "plant", 274, 59, 24, 24);
        sprite(g, "entrance", 7, 181, 45, 43);
        sprite(g, "queue", 53, 188, 24, 24);
        badge(g, "ENTRANCE", 12, 218);

        badge(g, "HOST", 88, 216);

        badge(g, "WAITER", 189, 216);

        var queue = game.getRestaurant().getWaitingQueue();
        badge(g, "QUEUE " + queue.size(), 18, 77);


        for (Table table : game.getRestaurant().getTables()) {
            int x = tableX(table.getNumber());
            boolean collecting = paymentCustomer != null && paymentCustomer.destination.x == x + 5;
            boolean free = table.isFree() && !collecting;
            sprite(g, free ? "table-free" : "table-occupied", x, 91, 88, 78);
            Customer occupant = table.getOccupant();
            if (occupant != null) {

                Order order = occupant.getOrder();
                boolean delivering = order != null && pendingDeliveries.containsKey(order.getId());
                if (order != null && order.getStatus() == OrderStatus.SERVED && !delivering) {
                    food(g, order.getItem(), x + 28, 124);
                }
                String status = order != null && occupant.getStatus() == CustomerStatus.ORDERED
                        ? order.getStatus().name() : occupant.getStatus().name();
                String transit = order == null ? "" : orderInTransit(order);
                if (!transit.isEmpty()) status = transit;
                badge(g, status.replace('_', ' '), x + 5, 170);
            }
            if (collecting) badge(g, "PAYMENT", x + 5, 170);
            badge(g, "TABLE " + table.getNumber() + (free ? " / FREE" : ""), x + 4, 72);
        }
        drawStaff(g, "host", host, 35);
        drawStaff(g, "waiter", waiter, 38);
        if (carryingTicket) {
            int ticketX = waiter.x() + (waiter.horizontalFacing < 0 ? 4 : 27);
            ticket(g, ticketX, waiter.y() + 13);
        }
        if (carriedOrder != null) {
            int trayX = waiter.x() + (waiter.horizontalFacing < 0 ? 0 : 21);
            food(g, carriedOrder.getItem(), trayX, waiter.y() + 12, 13);
        }
        for (Walker walker : customers.values()) {
            customer(g, walker, 29);
        }
        if (!chef.route.isEmpty()) {
            for (int i = 0; i < 3; i++) {
                int rise = ((int) (sceneTime * 22) + i * 5) % 15;
                g.setColor(new Color(255, 237, 203, 190 - rise * 10));
                g.fillRect(33 + i * 5, 27 - rise, 3, 3);
            }
        }
        g.dispose();
    }

    private void ticket(Graphics2D g, int x, int y) {
        g.setColor(INK);
        g.fillRect(x, y, 8, 10);
        g.setColor(CREAM);
        g.fillRect(x + 1, y + 1, 6, 8);
        g.setColor(INK);
        g.fillRect(x + 2, y + 3, 4, 1);
        g.fillRect(x + 2, y + 5, 3, 1);
    }

    private void drawOrderBox(Graphics2D g) {
        g.setColor(INK);
        g.fillRect(117, 52, 94, 19);
        g.setColor(new Color(0xa66e50));
        g.fillRect(119, 54, 90, 15);
        badge(g, "ORDER", 121, 56);
        int x = 153;
        for (Order order : game.getRestaurant().getOrdersWithStatus(OrderStatus.PREPARING)) {
            if (order.getId() == orderAwaitingHandoff) continue;
            ticket(g, x, 56);
            g.setColor(CREAM);
            g.drawString("#" + order.getId(), x + 9, 64);
            x += 27;
        }
    }

    private void drawPickupCounter(Graphics2D g) {
        g.setColor(INK);
        g.fillRect(117, 10, 94, 30);
        g.setColor(new Color(0xa66e50));
        g.fillRect(119, 12, 90, 26);
        badge(g, "PICKUP", 143, 42);
        int x = 126;
        for (Order order : game.getRestaurant().getOrdersWithStatus(OrderStatus.READY)) {
            food(g, order.getItem(), x, 14, 20);
            x += 40;
        }
        for (Order order : pendingDeliveries.values()) {
            if (order != carriedOrder && order.getStatus() == OrderStatus.SERVED && x < 200) {
                food(g, order.getItem(), x, 14, 20);
                x += 40;
            }
        }
    }

    private void drawStaff(Graphics2D g, String role, Walker staff, int size) {
        int idle = staff.route.isEmpty() && (int) (sceneTime * 2 + staff.home.x / 30.0) % 4 == 0 ? 1 : 0;
        drawWalker(g, role, staff, staff.y() - idle, size);
    }

    private void drawWalker(Graphics2D g, String role, Walker walker, int y, int size) {
        int x = walker.x();
        if (!walker.route.isEmpty() && walker.horizontalFacing != 0) {
            int step = (int) (walker.stride / 10) % 2 + 1;
            BufferedImage side = art.get(role + "-side-" + step);
            boolean left = walker.horizontalFacing < 0;
            g.drawImage(side, left ? x + size : x, y, left ? -size : size, size, null);
        } else {
            sprite(g, walkFrame(role, walker), x, y, size, size);
        }
    }

    private String walkFrame(String role, Walker walker) {
        if (walker.route.isEmpty()) return role;
        return switch ((int) (walker.stride / 7) % 4) {
            case 0 -> role + "-walk-1";
            case 2 -> role + "-walk-2";
            default -> role;
        };
    }

    private void customer(Graphics2D g, Walker walker, int size) {
        Customer customer = walker.customer;
        int x = walker.x();
        int y = walker.y();
        String role = customer.getTypeLabel().toLowerCase(Locale.ROOT);
        drawWalker(g, role, walker, y, size);
        int satisfaction = customer.getSatisfaction();
        Color mood = satisfaction >= 75 ? new Color(0x8cce88)
                : satisfaction >= 40 ? new Color(0xffcc76) : new Color(0xff867d);
        g.setColor(INK);
        g.fillRect(x + size - 8, y + 2, 10, 10);
        g.setColor(mood);
        g.fillRect(x + size - 7, y + 3, 8, 8);
        g.setColor(INK);
        g.fillRect(x + size - 5, y + 5, 1, 1);
        g.fillRect(x + size - 2, y + 5, 1, 1);
        g.fillRect(x + size - 5, y + (satisfaction >= 75 ? 9 : 8), 4, 1);
        if (satisfaction >= 75 || satisfaction < 40) {
            int corners = y + (satisfaction >= 75 ? 8 : 9);
            g.fillRect(x + size - 6, corners, 1, 1);
            g.fillRect(x + size - 1, corners, 1, 1);
        }
        badge(g, "C" + customer.getId() + " " + satisfaction, x, y + size - 1);
    }

    private void food(Graphics2D g, MenuItem item, int x, int y) {
        food(g, item, x, y, 23);
    }

    private void food(Graphics2D g, MenuItem item, int x, int y, int size) {
        if (item instanceof ComboMeal combo) {
            food(g, combo.getFirst(), x - size / 3, y, size);
            food(g, combo.getSecond(), x + size / 3, y, size);
        } else {
            sprite(g, item.getName().toLowerCase(Locale.ROOT), x, y, size, size);
        }
    }

    private void sprite(Graphics2D g, String name, int x, int y, int width, int height) {
        g.drawImage(art.get(name), x, y, width, height, null);
    }

    private void badge(Graphics2D g, String text, int x, int y) {
        g.setColor(INK);
        g.fillRect(x, y, g.getFontMetrics().stringWidth(text) + 6, 10);
        g.setColor(CREAM);
        g.drawString(text, x + 3, y + 8);
    }
}
